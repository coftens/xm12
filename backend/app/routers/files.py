"""文件管理路由 - 通过 SSH 远程管理文件"""
import os
import base64
import stat
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import io

from app.database import get_db
from app.models import Server, OperationLog, User
from app.auth import get_current_user
from app.services.ssh_service import SSHService

router = APIRouter(prefix="/api/files", tags=["文件管理"])


class FileItem(BaseModel):
    name: str
    path: str
    is_dir: bool
    size: int = 0
    permissions: str = ""
    owner: str = ""
    group: str = ""
    modified: str = ""


class FileContentRequest(BaseModel):
    path: str
    content: str
    encoding: str = "utf-8"


class FileActionRequest(BaseModel):
    path: str
    new_path: Optional[str] = None
    name: Optional[str] = None


@router.get("/{server_id}/list")
async def list_files(
    server_id: int,
    path: str = "/",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """列出目录内容"""
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="服务器不存在")

    ssh = SSHService()
    # 使用 ls -la 获取详细信息
    cmd = f'ls -la --time-style=long-iso "{path}" 2>/dev/null && echo "===PWD===" && pwd'
    stdout, stderr = ssh.execute_command(server, cmd)

    files = []
    lines = stdout.strip().split('\n')

    for line in lines:
        if line.startswith('total') or line.startswith('===') or not line.strip():
            continue
        parts = line.split(None, 7)
        if len(parts) < 8:
            continue

        perms = parts[0]
        owner = parts[2]
        group = parts[3]
        size = int(parts[4]) if parts[4].isdigit() else 0
        date_str = f"{parts[5]} {parts[6]}"
        name = parts[7]

        if name in ('.', '..'):
            continue

        is_dir = perms.startswith('d')
        is_link = perms.startswith('l')

        # 处理软链接名称
        if is_link and ' -> ' in name:
            name = name.split(' -> ')[0]

        full_path = os.path.join(path, name).replace('\\', '/')

        files.append({
            "name": name,
            "path": full_path,
            "is_dir": is_dir,
            "is_link": is_link,
            "size": size,
            "permissions": perms,
            "owner": owner,
            "group": group,
            "modified": date_str,
        })

    # 目录排前面，然后按名称排序
    files.sort(key=lambda x: (not x['is_dir'], x['name'].lower()))

    return {"path": path, "files": files}


@router.get("/{server_id}/read")
async def read_file_content(
    server_id: int,
    path: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """读取文件内容"""
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="服务器不存在")

    ssh = SSHService()

    # 先检查文件大小（限制 2MB）
    size_cmd = f'stat -c%s "{path}" 2>/dev/null'
    stdout, _ = ssh.execute_command(server, size_cmd)
    try:
        file_size = int(stdout.strip())
        if file_size > 2 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="文件过大（超过2MB），请使用下载功能")
    except ValueError:
        pass

    cmd = f'cat "{path}"'
    stdout, stderr = ssh.execute_command(server, cmd)

    if stderr and 'No such file' in stderr:
        raise HTTPException(status_code=404, detail="文件不存在")

    return {"path": path, "content": stdout}


@router.post("/{server_id}/save")
async def save_file_content(
    server_id: int,
    req: FileContentRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """保存文件内容"""
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="服务器不存在")

    ssh = SSHService()

    # 使用 base64 传输避免特殊字符问题
    content_b64 = base64.b64encode(req.content.encode(req.encoding)).decode()
    cmd = f'echo "{content_b64}" | base64 -d > "{req.path}"'
    _, stderr = ssh.execute_command(server, cmd)

    if stderr:
        raise HTTPException(status_code=500, detail=f"保存失败: {stderr}")

    # 操作日志
    log = OperationLog(
        user_id=current_user.id, username=current_user.username,
        action="edit_file", target=f"{server.name}:{req.path}",
        detail=f"编辑文件 {req.path}",
        ip_address=request.client.host if request.client else ""
    )
    db.add(log)
    db.commit()

    return {"message": "保存成功"}


@router.post("/{server_id}/mkdir")
async def create_directory(
    server_id: int,
    req: FileActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建目录"""
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="服务器不存在")

    ssh = SSHService()
    cmd = f'mkdir -p "{req.path}"'
    _, stderr = ssh.execute_command(server, cmd)

    if stderr:
        raise HTTPException(status_code=500, detail=f"创建失败: {stderr}")

    return {"message": "目录已创建"}


@router.post("/{server_id}/touch")
async def create_file(
    server_id: int,
    req: FileActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建空文件"""
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="服务器不存在")

    ssh = SSHService()
    cmd = f'touch "{req.path}"'
    _, stderr = ssh.execute_command(server, cmd)

    if stderr:
        raise HTTPException(status_code=500, detail=f"创建失败: {stderr}")

    return {"message": "文件已创建"}


@router.post("/{server_id}/rename")
async def rename_file(
    server_id: int,
    req: FileActionRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """重命名文件/目录"""
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="服务器不存在")

    if not req.new_path:
        raise HTTPException(status_code=400, detail="缺少 new_path")

    ssh = SSHService()
    cmd = f'mv "{req.path}" "{req.new_path}"'
    _, stderr = ssh.execute_command(server, cmd)

    if stderr:
        raise HTTPException(status_code=500, detail=f"重命名失败: {stderr}")

    log = OperationLog(
        user_id=current_user.id, username=current_user.username,
        action="rename_file", target=f"{server.name}:{req.path}",
        detail=f"重命名 {req.path} -> {req.new_path}",
        ip_address=request.client.host if request.client else ""
    )
    db.add(log)
    db.commit()

    return {"message": "重命名成功"}


@router.post("/{server_id}/delete")
async def delete_file(
    server_id: int,
    req: FileActionRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除文件/目录"""
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="服务器不存在")

    ssh = SSHService()
    cmd = f'rm -rf "{req.path}"'
    _, stderr = ssh.execute_command(server, cmd)

    if stderr:
        raise HTTPException(status_code=500, detail=f"删除失败: {stderr}")

    log = OperationLog(
        user_id=current_user.id, username=current_user.username,
        action="delete_file", target=f"{server.name}:{req.path}",
        detail=f"删除 {req.path}",
        ip_address=request.client.host if request.client else ""
    )
    db.add(log)
    db.commit()

    return {"message": "删除成功"}


@router.post("/{server_id}/chmod")
async def chmod_file(
    server_id: int,
    path: str,
    mode: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """修改文件权限"""
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="服务器不存在")

    ssh = SSHService()
    cmd = f'chmod {mode} "{path}"'
    _, stderr = ssh.execute_command(server, cmd)

    if stderr:
        raise HTTPException(status_code=500, detail=f"修改权限失败: {stderr}")

    return {"message": "权限已修改"}


@router.post("/{server_id}/compress")
async def compress_files(
    server_id: int,
    req: FileActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """压缩文件/目录"""
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="服务器不存在")

    ssh = SSHService()
    target = req.new_path or req.path + ".tar.gz"
    parent_dir = os.path.dirname(req.path)
    base_name = os.path.basename(req.path)
    cmd = f'cd "{parent_dir}" && tar -czf "{target}" "{base_name}"'
    _, stderr = ssh.execute_command(server, cmd, timeout=120)

    if stderr and 'Error' in stderr:
        raise HTTPException(status_code=500, detail=f"压缩失败: {stderr}")

    return {"message": "压缩成功", "target": target}


@router.post("/{server_id}/decompress")
async def decompress_file(
    server_id: int,
    req: FileActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """解压文件"""
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="服务器不存在")

    ssh = SSHService()
    target_dir = req.new_path or os.path.dirname(req.path)

    if req.path.endswith('.tar.gz') or req.path.endswith('.tgz'):
        cmd = f'tar -xzf "{req.path}" -C "{target_dir}"'
    elif req.path.endswith('.tar'):
        cmd = f'tar -xf "{req.path}" -C "{target_dir}"'
    elif req.path.endswith('.zip'):
        cmd = f'unzip -o "{req.path}" -d "{target_dir}"'
    elif req.path.endswith('.gz'):
        cmd = f'gunzip "{req.path}"'
    else:
        raise HTTPException(status_code=400, detail="不支持的压缩格式")

    _, stderr = ssh.execute_command(server, cmd, timeout=120)

    if stderr and 'Error' in stderr:
        raise HTTPException(status_code=500, detail=f"解压失败: {stderr}")

    return {"message": "解压成功"}


@router.get("/{server_id}/download")
async def download_file(
    server_id: int,
    path: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """下载文件（通过 SFTP）"""
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="服务器不存在")

    ssh = SSHService()
    try:
        client = ssh._create_client(server)
        sftp = client.open_sftp()
        file_stat = sftp.stat(path)
        file_obj = sftp.open(path, 'r')

        filename = os.path.basename(path)

        def iter_file():
            try:
                while True:
                    data = file_obj.read(8192)
                    if not data:
                        break
                    yield data
            finally:
                file_obj.close()
                sftp.close()
                client.close()

        return StreamingResponse(
            iter_file(),
            media_type="application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="文件不存在")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"下载失败: {str(e)}")


@router.post("/{server_id}/upload")
async def upload_file(
    server_id: int,
    path: str = Form(...),
    file: UploadFile = File(...),
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """上传文件（通过 SFTP）"""
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="服务器不存在")

    ssh = SSHService()
    try:
        client = ssh._create_client(server)
        sftp = client.open_sftp()

        remote_path = os.path.join(path, file.filename).replace('\\', '/')
        content = await file.read()
        file_obj = sftp.open(remote_path, 'w')
        file_obj.write(content)
        file_obj.close()
        sftp.close()
        client.close()

        log = OperationLog(
            user_id=current_user.id, username=current_user.username,
            action="upload_file", target=f"{server.name}:{remote_path}",
            detail=f"上传文件 {file.filename} 到 {remote_path}",
            ip_address=request.client.host if request and request.client else ""
        )
        db.add(log)
        db.commit()

        return {"message": "上传成功", "path": remote_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"上传失败: {str(e)}")
