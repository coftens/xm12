"""JWT 认证模块"""
from datetime import datetime, timedelta
from typing import Optional
import logging
import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import User

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


async def get_token(request: Request, token: str = Depends(oauth2_scheme)) -> str:
    """从多个位置提取 token"""
    logger.debug(f"OAuth2 token extracted: {token[:20] if token else 'None'}...")
    
    # 如果 OAuth2 成功提取，直接返回
    if token:
        logger.debug(f"Using token from OAuth2PasswordBearer")
        return token
    
    # 尝试从 Authorization 头手动提取
    auth_header = request.headers.get("Authorization", "")
    logger.debug(f"Authorization header: {auth_header[:50] if auth_header else 'Not present'}...")
    
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        logger.debug(f"Extracted token from Authorization header: {token[:20]}...")
        return token
    
    # 尝试从 Cookie 提取
    token_cookie = request.cookies.get("access_token")
    if token_cookie:
        logger.debug(f"Found token in cookie: {token_cookie[:20]}...")
        return token_cookie
    
    logger.warning("No token found in any location")
    return ""


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    logger.debug(f"Encoding token with data: {to_encode}, using algorithm: {settings.ALGORITHM}")
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    # PyJWT 1.7.1 returns string directly in Python 3.6+
    if isinstance(encoded_jwt, bytes):
        encoded_jwt = encoded_jwt.decode('utf-8')
    return encoded_jwt


async def get_current_user(
    token: str = Depends(get_token),
    db: Session = Depends(get_db)
) -> User:
    """从 JWT 获取当前用户"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效的认证凭证",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        logger.warning("No token provided")
        raise credentials_exception
    
    try:
        logger.info(f"Attempting to decode token: {token[:30]}...")
        logger.debug(f"Using SECRET_KEY (first 10 chars): {settings.SECRET_KEY[:10]}")
        logger.debug(f"Using algorithm: {settings.ALGORITHM}")
        
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        logger.info(f"Token decoded successfully, payload: {payload}")
        
        user_id: int = payload.get("sub")
        if user_id is None:
            logger.warning("Token has no 'sub' claim")
            raise credentials_exception
    except jwt.ExpiredSignatureError as e:
        logger.error(f"Token expired: {str(e)}")
        raise credentials_exception
    except jwt.InvalidTokenError as e:
        logger.error(f"JWT verification failed: {str(e)}")
        raise credentials_exception
    except Exception as e:
        logger.error(f"Unexpected error during JWT verification: {type(e).__name__}: {str(e)}")
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        logger.warning(f"User not found for id: {user_id}")
        raise credentials_exception
    if not user.is_active:
        logger.warning(f"User inactive: {user_id}")
        raise credentials_exception
    
    logger.info(f"User authenticated successfully: {user.username}")
    return user


async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """要求管理员权限"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return current_user
