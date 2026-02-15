"""日志路由"""
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models import OperationLog, User
from app.schemas import OperationLogOut
from app.auth import get_current_user, get_admin_user

router = APIRouter(prefix="/api/logs", tags=["日志"])


@router.get("", response_model=List[OperationLogOut])
async def list_logs(
    action: str = None,
    username: str = None,
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取操作日志"""
    query = db.query(OperationLog)

    # 非管理员只能看自己的日志
    if current_user.role != "admin":
        query = query.filter(OperationLog.user_id == current_user.id)

    if action:
        query = query.filter(OperationLog.action == action)
    if username:
        query = query.filter(OperationLog.username.contains(username))

    total = query.count()
    logs = query.order_by(desc(OperationLog.created_at)).offset(offset).limit(limit).all()
    return logs


@router.get("/actions")
async def get_log_actions(current_user: User = Depends(get_current_user)):
    """获取可用的操作类型"""
    return [
        {"value": "login", "label": "用户登录"},
        {"value": "logout", "label": "用户登出"},
        {"value": "create_server", "label": "添加服务器"},
        {"value": "update_server", "label": "更新服务器"},
        {"value": "delete_server", "label": "删除服务器"},
        {"value": "ssh_connect", "label": "SSH 连接"},
        {"value": "ssh_disconnect", "label": "SSH 断开"},
        {"value": "batch_command", "label": "批量命令"},
    ]
