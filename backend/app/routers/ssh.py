"""WebSocket SSH 终端路由"""
import asyncio
import json
import paramiko
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from app.config import settings
from app.database import SessionLocal
from app.models import Server, User, OperationLog
from app.services.ssh_service import SSHService

router = APIRouter(tags=["SSH终端"])


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
    except JWTError:
        await websocket.close(code=4001, reason="令牌过期或无效")
        return None, None

    db = SessionLocal()
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        db.close()
        await websocket.close(code=4001, reason="用户不存在或已禁用")
        return None, None

    return user, db


@router.websocket("/ws/ssh/{server_id}")
async def ssh_terminal(websocket: WebSocket, server_id: int):
    """WebSocket SSH 终端"""
    await websocket.accept()

    user, db = await authenticate_ws(websocket)
    if not user:
        return

    try:
        # 获取服务器信息
        server = db.query(Server).filter(Server.id == server_id).first()
        if not server:
            await websocket.send_text(json.dumps({"type": "error", "data": "服务器不存在"}))
            await websocket.close()
            return

        # 记录连接日志
        log = OperationLog(
            user_id=user.id,
            username=user.username,
            action="ssh_connect",
            target=f"{server.name}({server.host})",
            detail=f"SSH 连接到 {server.host}:{server.port}",
        )
        db.add(log)
        db.commit()

        # 创建 SSH 连接
        ssh_service = SSHService()
        try:
            client, channel = ssh_service.create_shell(server)
        except Exception as e:
            await websocket.send_text(json.dumps({"type": "error", "data": f"SSH 连接失败: {str(e)}"}))
            await websocket.close()
            return

        # 更新服务器状态
        server.status = "online"
        db.commit()

        await websocket.send_text(json.dumps({"type": "connected", "data": f"已连接到 {server.name}"}))

        # 从 SSH 读取数据并发送到 WebSocket
        async def read_ssh():
            loop = asyncio.get_event_loop()
            while True:
                try:
                    data = await loop.run_in_executor(None, lambda: channel.recv(4096))
                    if not data:
                        break
                    await websocket.send_text(json.dumps({
                        "type": "output",
                        "data": data.decode('utf-8', errors='replace')
                    }))
                except Exception:
                    break

        read_task = asyncio.create_task(read_ssh())

        # 从 WebSocket 读取数据并发送到 SSH
        try:
            while True:
                message = await websocket.receive_text()
                msg = json.loads(message)

                if msg.get("type") == "input":
                    channel.send(msg["data"].encode('utf-8'))
                elif msg.get("type") == "resize":
                    cols = msg.get("cols", 120)
                    rows = msg.get("rows", 40)
                    channel.resize_pty(width=cols, height=rows)

        except WebSocketDisconnect:
            pass
        except Exception:
            pass
        finally:
            read_task.cancel()
            try:
                channel.close()
                client.close()
            except Exception:
                pass

            # 记录断开日志
            disconnect_log = OperationLog(
                user_id=user.id,
                username=user.username,
                action="ssh_disconnect",
                target=f"{server.name}({server.host})",
                detail=f"SSH 断开连接",
            )
            db.add(disconnect_log)
            db.commit()

    finally:
        db.close()
