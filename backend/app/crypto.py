"""凭证加密/解密模块 - 使用 AES-GCM"""
import base64
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.config import settings


def _get_key() -> bytes:
    """获取加密密钥（确保32字节）"""
    key = settings.ENCRYPTION_KEY.encode('utf-8')
    # 补齐或截断到32字节
    if len(key) < 32:
        key = key + b'\0' * (32 - len(key))
    return key[:32]


def encrypt_credential(plaintext: str) -> str:
    """加密凭证"""
    if not plaintext:
        return ""
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # 96-bit nonce
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode('utf-8'), None)
    # nonce + ciphertext 一起 base64 编码
    return base64.b64encode(nonce + ciphertext).decode('utf-8')


def decrypt_credential(encrypted: str) -> str:
    """解密凭证"""
    if not encrypted:
        return ""
    key = _get_key()
    aesgcm = AESGCM(key)
    raw = base64.b64decode(encrypted)
    nonce = raw[:12]
    ciphertext = raw[12:]
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode('utf-8')
