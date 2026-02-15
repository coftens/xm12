"""SSH 连接服务"""
import io
import paramiko
import threading
from typing import Tuple, Optional
from app.models import Server
from app.crypto import decrypt_credential


class SSHService:
    """SSH 连接管理"""

    def _create_client(self, server: Server) -> paramiko.SSHClient:
        """创建 SSH 客户端"""
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        connect_params = {
            "hostname": server.host,
            "port": server.port,
            "username": server.username,
            "timeout": 10,
        }

        if server.auth_type == "password":
            connect_params["password"] = decrypt_credential(server.encrypted_password)
        elif server.auth_type == "key":
            key_str = decrypt_credential(server.encrypted_private_key)
            key_file = io.StringIO(key_str)
            try:
                pkey = paramiko.RSAKey.from_private_key(key_file)
            except paramiko.ssh_exception.SSHException:
                key_file.seek(0)
                try:
                    pkey = paramiko.Ed25519Key.from_private_key(key_file)
                except Exception:
                    key_file.seek(0)
                    pkey = paramiko.ECDSAKey.from_private_key(key_file)
            connect_params["pkey"] = pkey

        client.connect(**connect_params)
        return client

    def test_connection(self, server: Server) -> Tuple[bool, str]:
        """测试连接"""
        try:
            client = self._create_client(server)
            client.close()
            return True, "连接成功"
        except paramiko.AuthenticationException:
            return False, "认证失败：用户名或密码/密钥错误"
        except paramiko.SSHException as e:
            return False, f"SSH 错误：{str(e)}"
        except Exception as e:
            return False, f"连接失败：{str(e)}"

    def execute_command(self, server: Server, command: str, timeout: int = 30) -> Tuple[str, str]:
        """执行远程命令，返回 (stdout, stderr)"""
        client = self._create_client(server)
        try:
            stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
            out = stdout.read().decode('utf-8', errors='replace')
            err = stderr.read().decode('utf-8', errors='replace')
            return out, err
        finally:
            client.close()

    def create_shell(self, server: Server) -> Tuple[paramiko.SSHClient, paramiko.Channel]:
        """创建交互式 Shell（用于 WebSocket SSH）"""
        client = self._create_client(server)
        channel = client.invoke_shell(term='xterm-256color', width=120, height=40)
        channel.settimeout(0)
        return client, channel
