"""批量操作路由"""
import asyncio
import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Server, BatchTask, BatchTaskResult, OperationLog, User
from app.schemas import BatchCommandRequest, BatchTaskOut, BatchTaskResultOut
from app.auth import get_current_user
from app.services.ssh_service import SSHService

router = APIRouter(prefix="/api/batch", tags=["批量操作"])


@router.post("/command", response_model=BatchTaskOut)
async def batch_execute_command(
    req: BatchCommandRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """批量执行命令"""
    # 验证服务器存在
    servers = db.query(Server).filter(Server.id.in_(req.server_ids)).all()
    if not servers:
        raise HTTPException(status_code=400, detail="未找到有效服务器")

    # 创建任务
    task = BatchTask(
        user_id=current_user.id,
        task_type="command",
        command=req.command,
        server_ids=",".join(str(s.id) for s in servers),
        status="running"
    )
    db.add(task)
    db.flush()

    # 逐个执行
    ssh_service = SSHService()
    all_success = True

    for server in servers:
        result = BatchTaskResult(
            task_id=task.id,
            server_id=server.id,
            server_name=server.name,
            status="pending"
        )
        try:
            stdout, stderr = ssh_service.execute_command(server, req.command, timeout=60)
            result.output = stdout
            result.error = stderr
            result.status = "success" if not stderr else "success"
        except Exception as e:
            result.status = "failed"
            result.error = str(e)
            all_success = False

        db.add(result)

    task.status = "completed" if all_success else "completed"
    task.completed_at = datetime.datetime.utcnow()
    db.flush()

    # 操作日志
    log = OperationLog(
        user_id=current_user.id,
        username=current_user.username,
        action="batch_command",
        target=f"{len(servers)} 台服务器",
        detail=f"批量执行命令: {req.command[:100]}",
        ip_address=request.client.host if request.client else ""
    )
    db.add(log)
    db.commit()
    db.refresh(task)

    return task


@router.get("/tasks", response_model=List[BatchTaskOut])
async def list_batch_tasks(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取批量任务列表"""
    tasks = db.query(BatchTask).filter(
        BatchTask.user_id == current_user.id
    ).order_by(BatchTask.created_at.desc()).limit(limit).all()
    return tasks


@router.get("/tasks/{task_id}/results", response_model=List[BatchTaskResultOut])
async def get_task_results(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取任务执行结果"""
    results = db.query(BatchTaskResult).filter(
        BatchTaskResult.task_id == task_id
    ).all()
    return results
