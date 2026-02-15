"""服务器资产管理路由"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models import Server, ServerGroup, OperationLog, User
from app.schemas import (
    ServerCreate, ServerUpdate, ServerOut,
    ServerGroupCreate, ServerGroupOut
)
from app.auth import get_current_user
from app.crypto import encrypt_credential

router = APIRouter(prefix="/api/servers", tags=["服务器管理"])


# ==================== 分组管理 ====================
@router.get("/groups", response_model=List[ServerGroupOut])
async def list_groups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(ServerGroup).all()


@router.post("/groups", response_model=ServerGroupOut)
async def create_group(
    req: ServerGroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if db.query(ServerGroup).filter(ServerGroup.name == req.name).first():
        raise HTTPException(status_code=400, detail="分组名已存在")
    group = ServerGroup(name=req.name, description=req.description)
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


@router.put("/groups/{group_id}", response_model=ServerGroupOut)
async def update_group(
    group_id: int,
    req: ServerGroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    group = db.query(ServerGroup).filter(ServerGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="分组不存在")
    group.name = req.name
    group.description = req.description
    db.commit()
    db.refresh(group)
    return group


@router.delete("/groups/{group_id}")
async def delete_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    group = db.query(ServerGroup).filter(ServerGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="分组不存在")
    # 取消关联的服务器分组
    db.query(Server).filter(Server.group_id == group_id).update({"group_id": None})
    db.delete(group)
    db.commit()
    return {"message": "分组已删除"}


# ==================== 服务器管理 ====================
@router.get("", response_model=List[ServerOut])
async def list_servers(
    group_id: Optional[int] = None,
    keyword: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取服务器列表"""
    query = db.query(Server).filter(Server.is_active == True)  # noqa
    if group_id:
        query = query.filter(Server.group_id == group_id)
    if keyword:
        query = query.filter(
            (Server.name.contains(keyword)) |
            (Server.host.contains(keyword)) |
            (Server.description.contains(keyword))
        )
    servers = query.all()
    result = []
    for s in servers:
        out = ServerOut.model_validate(s)
        if s.group:
            out.group_name = s.group.name
        result.append(out)
    return result


@router.get("/{server_id}", response_model=ServerOut)
async def get_server(
    server_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="服务器不存在")
    out = ServerOut.model_validate(server)
    if server.group:
        out.group_name = server.group.name
    return out


@router.post("", response_model=ServerOut)
async def create_server(
    req: ServerCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """添加服务器"""
    server = Server(
        name=req.name,
        host=req.host,
        port=req.port,
        username=req.username,
        auth_type=req.auth_type,
        group_id=req.group_id,
        description=req.description,
    )
    # 加密存储凭证
    if req.auth_type == "password" and req.password:
        server.encrypted_password = encrypt_credential(req.password)
    elif req.auth_type == "key" and req.private_key:
        server.encrypted_private_key = encrypt_credential(req.private_key)

    db.add(server)
    db.flush()

    # 操作日志
    log = OperationLog(
        user_id=current_user.id,
        username=current_user.username,
        action="create_server",
        target=f"{req.name}({req.host})",
        detail=f"添加服务器: {req.name} ({req.host}:{req.port})",
        ip_address=request.client.host if request.client else ""
    )
    db.add(log)
    db.commit()
    db.refresh(server)

    out = ServerOut.model_validate(server)
    if server.group:
        out.group_name = server.group.name
    return out


@router.put("/{server_id}", response_model=ServerOut)
async def update_server(
    server_id: int,
    req: ServerUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新服务器"""
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="服务器不存在")

    if req.name is not None:
        server.name = req.name
    if req.host is not None:
        server.host = req.host
    if req.port is not None:
        server.port = req.port
    if req.username is not None:
        server.username = req.username
    if req.auth_type is not None:
        server.auth_type = req.auth_type
    if req.password is not None:
        server.encrypted_password = encrypt_credential(req.password)
    if req.private_key is not None:
        server.encrypted_private_key = encrypt_credential(req.private_key)
    if req.group_id is not None:
        server.group_id = req.group_id
    if req.description is not None:
        server.description = req.description

    # 操作日志
    log = OperationLog(
        user_id=current_user.id,
        username=current_user.username,
        action="update_server",
        target=f"{server.name}({server.host})",
        detail=f"更新服务器信息",
        ip_address=request.client.host if request.client else ""
    )
    db.add(log)
    db.commit()
    db.refresh(server)

    out = ServerOut.model_validate(server)
    if server.group:
        out.group_name = server.group.name
    return out


@router.delete("/{server_id}")
async def delete_server(
    server_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除服务器"""
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="服务器不存在")

    name = server.name
    host = server.host

    db.delete(server)

    log = OperationLog(
        user_id=current_user.id,
        username=current_user.username,
        action="delete_server",
        target=f"{name}({host})",
        detail=f"删除服务器: {name}",
        ip_address=request.client.host if request.client else ""
    )
    db.add(log)
    db.commit()
    return {"message": "服务器已删除"}


@router.post("/{server_id}/test")
async def test_connection(
    server_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """测试服务器连接"""
    from app.services.ssh_service import SSHService
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="服务器不存在")

    ssh_service = SSHService()
    success, message = ssh_service.test_connection(server)

    # 更新状态
    server.status = "online" if success else "offline"
    db.commit()

    return {"success": success, "message": message}
