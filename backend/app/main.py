"""FastAPI 应用入口"""
import os
import sys
import logging
from fastapi import FastAPI

# 配置日志
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Python 3.6 兼容性
if sys.version_info >= (3, 7):
    from contextlib import asynccontextmanager
else:
    from async_generator import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from app.config import settings
from app.database import init_db, SessionLocal
from app.auth import get_password_hash
from app.models import User, Server, MonitorRecord, AlertRule, AlertLog

# 路由导入
from app.routers import auth, servers, ssh, monitor, batch, logs, files, system, monitor_ws


def create_default_admin():
    """创建默认管理员账号"""
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                hashed_password=get_password_hash("admin123"),
                role="admin"
            )
            db.add(admin)
            db.commit()
            print("✅ 默认管理员已创建 (admin / admin123)")
    finally:
        db.close()


def monitor_job():
    """定时监控采集任务"""
    from app.services.monitor_service import MonitorService
    db = SessionLocal()
    try:
        monitor_service = MonitorService()
        servers_list = db.query(Server).filter(Server.is_active == True).all()  # noqa

        for server in servers_list:
            data = monitor_service.collect(server)
            if data:
                record = MonitorRecord(
                    server_id=server.id,
                    **data
                )
                db.add(record)
                server.status = "online"

                # 检查告警规则
                rules = db.query(AlertRule).filter(
                    AlertRule.server_id == server.id,
                    AlertRule.is_active == True  # noqa
                ).all()
                for rule in rules:
                    value = data.get(rule.metric, 0)
                    triggered = False
                    if rule.operator == ">" and value > rule.threshold:
                        triggered = True
                    elif rule.operator == ">=" and value >= rule.threshold:
                        triggered = True
                    elif rule.operator == "<" and value < rule.threshold:
                        triggered = True
                    elif rule.operator == "<=" and value <= rule.threshold:
                        triggered = True

                    if triggered:
                        metric_names = {
                            "cpu_usage": "CPU使用率",
                            "memory_usage": "内存使用率",
                            "disk_usage": "磁盘使用率"
                        }
                        alert = AlertLog(
                            server_id=server.id,
                            rule_id=rule.id,
                            metric=rule.metric,
                            value=value,
                            threshold=rule.threshold,
                            message=f"{server.name} {metric_names.get(rule.metric, rule.metric)} "
                                    f"当前值 {value}% {rule.operator} 阈值 {rule.threshold}%"
                        )
                        db.add(alert)
            else:
                server.status = "offline"

        db.commit()
    except Exception as e:
        print(f"监控任务异常: {e}")
        db.rollback()
    finally:
        db.close()


scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期"""
    # 确保数据目录存在
    os.makedirs("data", exist_ok=True)

    # 初始化数据库
    init_db()
    create_default_admin()

    # 启动定时监控
    scheduler.add_job(monitor_job, 'interval', seconds=settings.MONITOR_INTERVAL, id='monitor_job')
    scheduler.start()
    print(f"✅ 监控定时任务已启动（间隔 {settings.MONITOR_INTERVAL} 秒）")

    yield

    # 关闭
    scheduler.shutdown()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境建议配置具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router)
app.include_router(servers.router)
app.include_router(ssh.router)
app.include_router(monitor.router)
app.include_router(monitor_ws.router)
app.include_router(batch.router)
app.include_router(logs.router)
app.include_router(files.router)
app.include_router(system.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME}
