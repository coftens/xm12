"""数据库模型定义"""
import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    """用户表"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(128), nullable=False)
    role = Column(String(20), default="user")  # admin / user
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class ServerGroup(Base):
    """服务器分组表"""
    __tablename__ = "server_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255), default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    servers = relationship("Server", back_populates="group")


class Server(Base):
    """服务器表"""
    __tablename__ = "servers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    host = Column(String(255), nullable=False)
    port = Column(Integer, default=22)
    username = Column(String(100), nullable=False)
    auth_type = Column(String(20), default="password")  # password / key
    encrypted_password = Column(Text, default="")       # 加密后的密码
    encrypted_private_key = Column(Text, default="")    # 加密后的私钥
    group_id = Column(Integer, ForeignKey("server_groups.id"), nullable=True)
    description = Column(Text, default="")
    status = Column(String(20), default="unknown")      # online / offline / unknown
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    group = relationship("ServerGroup", back_populates="servers")
    monitor_records = relationship("MonitorRecord", back_populates="server", cascade="all, delete-orphan")


class MonitorRecord(Base):
    """监控记录表"""
    __tablename__ = "monitor_records"

    id = Column(Integer, primary_key=True, index=True)
    server_id = Column(Integer, ForeignKey("servers.id"), nullable=False)
    cpu_usage = Column(Float, default=0)
    memory_total = Column(Float, default=0)     # MB
    memory_used = Column(Float, default=0)      # MB
    memory_usage = Column(Float, default=0)     # 百分比
    disk_total = Column(Float, default=0)       # GB
    disk_used = Column(Float, default=0)        # GB
    disk_usage = Column(Float, default=0)       # 百分比
    net_in = Column(Float, default=0)           # KB/s
    net_out = Column(Float, default=0)          # KB/s
    load_1 = Column(Float, default=0)
    load_5 = Column(Float, default=0)
    load_15 = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    server = relationship("Server", back_populates="monitor_records")


class AlertRule(Base):
    """告警规则表"""
    __tablename__ = "alert_rules"

    id = Column(Integer, primary_key=True, index=True)
    server_id = Column(Integer, ForeignKey("servers.id"), nullable=False)
    metric = Column(String(50), nullable=False)      # cpu_usage / memory_usage / disk_usage
    operator = Column(String(10), default=">")        # > / < / >= / <=
    threshold = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class AlertLog(Base):
    """告警日志表"""
    __tablename__ = "alert_logs"

    id = Column(Integer, primary_key=True, index=True)
    server_id = Column(Integer, ForeignKey("servers.id"), nullable=False)
    rule_id = Column(Integer, ForeignKey("alert_rules.id"), nullable=False)
    metric = Column(String(50), nullable=False)
    value = Column(Float, nullable=False)
    threshold = Column(Float, nullable=False)
    message = Column(Text, default="")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class OperationLog(Base):
    """操作日志表"""
    __tablename__ = "operation_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    username = Column(String(50), nullable=False)
    action = Column(String(50), nullable=False)       # login / logout / create_server / ssh_connect / batch_exec ...
    target = Column(String(255), default="")           # 操作对象
    detail = Column(Text, default="")                  # 详细信息
    ip_address = Column(String(50), default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class BatchTask(Base):
    """批量任务表"""
    __tablename__ = "batch_tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task_type = Column(String(20), nullable=False)     # command / upload / download
    command = Column(Text, default="")
    server_ids = Column(Text, default="")              # 逗号分隔的服务器ID
    status = Column(String(20), default="pending")     # pending / running / completed / failed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)


class BatchTaskResult(Base):
    """批量任务结果表"""
    __tablename__ = "batch_task_results"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("batch_tasks.id"), nullable=False)
    server_id = Column(Integer, ForeignKey("servers.id"), nullable=False)
    server_name = Column(String(100), default="")
    status = Column(String(20), default="pending")     # pending / success / failed
    output = Column(Text, default="")
    error = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
