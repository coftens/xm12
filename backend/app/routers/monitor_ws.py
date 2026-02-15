"""WebSocket 系统监控数据推送"""
import asyncio
import json
import jwt
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.config import settings
from app.database import SessionLocal
from app.models import Server, User
from app.services.monitor_service import MonitorService

router = APIRouter(tags=["监控WebSocket"])


async def authenticate_ws(websocket: WebSocket) -> tuple:
    """WebSocket 认证：从查询参数获取 token"""
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="缺少认证令牌")
        return None, None

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            await websocket.close(code=4001, reason="无效令牌")
            return None, None
    except jwt.InvalidTokenError:
        await websocket.close(code=4001, reason="令牌过期或无效")
        return None, None

    db = SessionLocal()
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        db.close()
        await websocket.close(code=4001, reason="用户不存在或已禁用")
        return None, None

    return user, db


@router.websocket("/ws/monitor/{server_id}")
async def monitor_stream(websocket: WebSocket, server_id: int):
    """WebSocket 实时系统监控数据推送"""
    await websocket.accept()

    user, db = await authenticate_ws(websocket)
    if not user:
        return

    try:
        # 获取服务器信息
        server = db.query(Server).filter(Server.id == server_id).first()
        if not server:
            await websocket.send_text(json.dumps({"type": "error", "message": "服务器不存在"}))
            await websocket.close()
            return

        system_service = MonitorService()
        
        # 持续推送监控数据
        while True:
            try:
                # 获取系统信息
                system_info = system_service.collect(server)
                
                if system_info:
                    # 发送数据
                    await websocket.send_text(json.dumps({
                        "type": "monitor_data",
                        "data": system_info
                    }))
                else:
                    # 采集失败
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "无法采集监控数据"
                    }))
                
                # 等待 3 秒再推送下一次
                await asyncio.sleep(3)
                
            except Exception as e:
                print(f"获取监控数据失败: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": f"获取监控数据失败: {str(e)}"
                }))
                await asyncio.sleep(5)  # 错误时等待更长时间
                
    except WebSocketDisconnect:
        print(f"WebSocket 断开连接: 服务器 {server_id}")
    except Exception as e:
        print(f"WebSocket 错误: {e}")
    finally:
        if db:
            db.close()
