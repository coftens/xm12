"""监控路由"""
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models import Server, MonitorRecord, AlertRule, AlertLog, User
from app.schemas import MonitorData, AlertRuleCreate, AlertRuleOut, AlertLogOut
from app.auth import get_current_user
from app.services.monitor_service import MonitorService

router = APIRouter(prefix="/api/monitor", tags=["监控"])


@router.get("/{server_id}/realtime", response_model=MonitorData)
async def get_realtime_monitor(
    server_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取实时监控数据"""
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="服务器不存在")

    monitor_service = MonitorService()
    data = monitor_service.get_realtime(server)
    if data is None:
        raise HTTPException(status_code=500, detail="监控数据采集失败")

    return data


@router.get("/{server_id}/history", response_model=list[MonitorData])
async def get_history_monitor(
    server_id: int,
    hours: int = Query(default=24, ge=1, le=168),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取历史监控数据"""
    since = datetime.datetime.utcnow() - datetime.timedelta(hours=hours)
    records = db.query(MonitorRecord).filter(
        MonitorRecord.server_id == server_id,
        MonitorRecord.created_at >= since
    ).order_by(MonitorRecord.created_at.asc()).all()
    return records


# ==================== 告警规则 ====================
@router.get("/alerts/rules", response_model=list[AlertRuleOut])
async def list_alert_rules(
    server_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(AlertRule)
    if server_id:
        query = query.filter(AlertRule.server_id == server_id)
    return query.all()


@router.post("/alerts/rules", response_model=AlertRuleOut)
async def create_alert_rule(
    req: AlertRuleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rule = AlertRule(**req.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/alerts/rules/{rule_id}")
async def delete_alert_rule(
    rule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rule = db.query(AlertRule).filter(AlertRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="规则不存在")
    db.delete(rule)
    db.commit()
    return {"message": "规则已删除"}


@router.get("/alerts/logs", response_model=list[AlertLogOut])
async def list_alert_logs(
    server_id: int = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(AlertLog)
    if server_id:
        query = query.filter(AlertLog.server_id == server_id)
    return query.order_by(desc(AlertLog.created_at)).limit(limit).all()


@router.put("/alerts/logs/{log_id}/read")
async def mark_alert_read(
    log_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    log = db.query(AlertLog).filter(AlertLog.id == log_id).first()
    if log:
        log.is_read = True
        db.commit()
    return {"message": "已标为已读"}
