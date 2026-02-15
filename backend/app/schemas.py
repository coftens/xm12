"""Pydantic 数据模型（请求/响应）"""
from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


# ==================== 用户 ====================
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)
    role: str = Field(default="user")


class UserUpdate(BaseModel):
    password: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserOut(BaseModel):
    id: int
    username: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    username: str
    password: str


# ==================== 服务器分组 ====================
class ServerGroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str = ""


class ServerGroupOut(BaseModel):
    id: int
    name: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== 服务器 ====================
class ServerCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    host: str = Field(..., min_length=1)
    port: int = Field(default=22, ge=1, le=65535)
    username: str = Field(..., min_length=1)
    auth_type: str = Field(default="password")  # password / key
    password: Optional[str] = None
    private_key: Optional[str] = None
    group_id: Optional[int] = None
    description: str = ""


class ServerUpdate(BaseModel):
    name: Optional[str] = None
    host: Optional[str] = None
    port: Optional[int] = None
    username: Optional[str] = None
    auth_type: Optional[str] = None
    password: Optional[str] = None
    private_key: Optional[str] = None
    group_id: Optional[int] = None
    description: Optional[str] = None


class ServerOut(BaseModel):
    id: int
    name: str
    host: str
    port: int
    username: str
    auth_type: str
    group_id: Optional[int]
    description: str
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    group_name: Optional[str] = None

    class Config:
        from_attributes = True


# ==================== 监控 ====================
class MonitorData(BaseModel):
    cpu_usage: float
    memory_total: float
    memory_used: float
    memory_usage: float
    disk_total: float
    disk_used: float
    disk_usage: float
    net_in: float
    net_out: float
    load_1: float
    load_5: float
    load_15: float
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== 告警 ====================
class AlertRuleCreate(BaseModel):
    server_id: int
    metric: str
    operator: str = ">"
    threshold: float
    is_active: bool = True


class AlertRuleOut(BaseModel):
    id: int
    server_id: int
    metric: str
    operator: str
    threshold: float
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AlertLogOut(BaseModel):
    id: int
    server_id: int
    rule_id: int
    metric: str
    value: float
    threshold: float
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== 批量操作 ====================
class BatchCommandRequest(BaseModel):
    server_ids: List[int]
    command: str


class BatchTaskOut(BaseModel):
    id: int
    task_type: str
    command: str
    server_ids: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BatchTaskResultOut(BaseModel):
    id: int
    task_id: int
    server_id: int
    server_name: str
    status: str
    output: str
    error: str

    class Config:
        from_attributes = True


# ==================== 日志 ====================
class OperationLogOut(BaseModel):
    id: int
    user_id: int
    username: str
    action: str
    target: str
    detail: str
    ip_address: str
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== 通用 ====================
class ApiResponse(BaseModel):
    code: int = 0
    message: str = "success"
    data: Optional[Any] = None
