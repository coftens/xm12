"""应用配置"""
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # 应用配置
    APP_NAME: str = "服务器远程管理平台"
    DEBUG: bool = False

    # 数据库
    DATABASE_URL: str = "sqlite:///./data/server_mgmt.db"

    # JWT 配置
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-please-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8小时

    # 凭证加密密钥（32字节）
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", "dev-encryption-key-change-this!!")

    # 监控配置
    MONITOR_INTERVAL: int = 60  # 监控采集间隔（秒）
    MONITOR_HISTORY_DAYS: int = 7  # 历史数据保留天数

    class Config:
        env_file = ".env"


settings = Settings()
