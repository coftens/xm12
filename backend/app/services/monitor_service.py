"""服务器监控服务"""
import re
from typing import Dict, Optional
from app.models import Server
from app.services.ssh_service import SSHService


class MonitorService:
    """通过 SSH 采集服务器监控数据"""

    def __init__(self):
        self.ssh_service = SSHService()

    def collect(self, server: Server) -> Optional[Dict]:
        """采集服务器监控数据"""
        try:
            # 一次性执行多个命令，减少连接次数
            commands = """
echo "===CPU==="
top -bn1 | grep "Cpu(s)" | awk '{print $2}'
echo "===CPU_COUNT==="
grep -c ^processor /proc/cpuinfo
echo "===MEMORY==="
free -m | grep Mem
echo "===DISK==="
df -BG --total | grep total
echo "===LOAD==="
cat /proc/loadavg
echo "===NETWORK==="
cat /proc/net/dev | grep -E "eth0|ens|eno|enp"
echo "===UPTIME==="
cat /proc/uptime
echo "===DISK_IO==="
cat /proc/diskstats | grep -E 'sda|vda|xvda|nvme0n1' | head -n 1 | awk '{print $6,$10}'
echo "===SYSTEM==="
cat /etc/os-release | grep -E "^ID=|^VERSION_ID="
grep "model name" /proc/cpuinfo | head -n 1 | awk -F: '{print $2}'
"""
            stdout, stderr = self.ssh_service.execute_command(server, commands, timeout=15)
            return self._parse_output(stdout)
        except Exception as e:
            print(f"监控采集失败 [{server.name}]: {e}")
            return None

    def _parse_output(self, output: str) -> Dict:
        """解析命令输出"""
        data = {
            "cpu_usage": 0,
            "cpu_count": 0,
            "memory_total": 0,
            "memory_used": 0,
            "memory_usage": 0,
            "disk_total": 0,
            "disk_used": 0,
            "disk_usage": 0,
            "net_in": 0,
            "net_out": 0,
            "load_1": 0,
            "load_5": 0,
            "load_15": 0,
            "uptime": 0,
            "disk_read_sectors": 0,
            "disk_write_sectors": 0,
            "platform": "Unknown",
            "platform_release": "",
            "processor": "Unknown Processor",
            "_src_version": "v2_added_system_info"
        }

        sections = output.split("===")

        for i, section in enumerate(sections):
            section = section.strip()

            if section == "CPU" and i + 1 < len(sections):
                try:
                    cpu_str = sections[i + 1].strip().split('\n')[0]
                    data["cpu_usage"] = round(float(cpu_str), 1)
                except (ValueError, IndexError):
                    pass

            elif section == "CPU_COUNT" and i + 1 < len(sections):
                try:
                    count_str = sections[i + 1].strip().split('\n')[0]
                    data["cpu_count"] = int(count_str)
                except (ValueError, IndexError):
                    pass

            elif section == "MEMORY" and i + 1 < len(sections):
                try:
                    mem_line = sections[i + 1].strip().split('\n')[0]
                    parts = mem_line.split()
                    data["memory_total"] = float(parts[1])
                    data["memory_used"] = float(parts[2])
                    if data["memory_total"] > 0:
                        data["memory_usage"] = round(data["memory_used"] / data["memory_total"] * 100, 1)
                except (ValueError, IndexError):
                    pass

            elif section == "DISK" and i + 1 < len(sections):
                try:
                    disk_line = sections[i + 1].strip().split('\n')[0]
                    parts = disk_line.split()
                    data["disk_total"] = float(parts[1].replace('G', ''))
                    data["disk_used"] = float(parts[2].replace('G', ''))
                    if data["disk_total"] > 0:
                        data["disk_usage"] = round(data["disk_used"] / data["disk_total"] * 100, 1)
                except (ValueError, IndexError):
                    pass

            elif section == "LOAD" and i + 1 < len(sections):
                try:
                    load_line = sections[i + 1].strip().split('\n')[0]
                    parts = load_line.split()
                    data["load_1"] = float(parts[0])
                    data["load_5"] = float(parts[1])
                    data["load_15"] = float(parts[2])
                except (ValueError, IndexError):
                    pass

            elif section == "NETWORK" and i + 1 < len(sections):
                try:
                    net_line = sections[i + 1].strip().split('\n')[0]
                    parts = net_line.split()
                    # /proc/net/dev 格式: Interface: bytes packets ...
                    data["net_in"] = round(float(parts[1]) / 1024, 1)   # 转 KB
                    data["net_out"] = round(float(parts[9]) / 1024, 1)
                except (ValueError, IndexError):
                    pass

            elif section == "UPTIME" and i + 1 < len(sections):
                try:
                    uptime_str = sections[i + 1].strip().split()[0]
                    data["uptime"] = float(uptime_str)
                except (ValueError, IndexError):
                    pass

            elif section == "DISK_IO" and i + 1 < len(sections):
                try:
                    parts = sections[i + 1].strip().split()
                    data["disk_read_sectors"] = int(parts[0])
                    data["disk_write_sectors"] = int(parts[1])
                except (ValueError, IndexError):
                    pass
            
            elif section == "SYSTEM" and i + 1 < len(sections):
                try:
                    lines = sections[i + 1].strip().split('\n')
                    for line in lines:
                        if line.startswith("ID="):
                            data["platform"] = line.split("=")[1].strip('"')
                        elif line.startswith("VERSION_ID="):
                            data["platform_release"] = line.split("=")[1].strip('"')
                        elif "Intel" in line or "AMD" in line or "CPU" in line:
                             data["processor"] = line.strip()
                except (ValueError, IndexError):
                    pass

        return data

    def get_realtime(self, server: Server) -> Optional[Dict]:
        """获取实时监控数据（更精简的命令）"""
        try:
            cmd = (
                "echo $(grep 'cpu ' /proc/stat | awk '{usage=($2+$4)*100/($2+$4+$5)} END {print usage}');"
                "free -m | awk '/Mem/{print $2,$3}';"
                "df -BG --total | awk '/total/{print $2,$3}';"
                "cat /proc/loadavg | awk '{print $1,$2,$3}';"
                "cat /proc/uptime | awk '{print $1}';"
                "grep -c ^processor /proc/cpuinfo;"
                "cat /proc/diskstats | grep -E 'sda|vda|xvda|nvme0n1' | head -n 1 | awk '{print $6,$10}'"
            )
            stdout, _ = self.ssh_service.execute_command(server, cmd, timeout=10)
            lines = stdout.strip().split('\n')

            data = {
                "cpu_usage": 0, "cpu_count": 0, "memory_total": 0, "memory_used": 0, "memory_usage": 0,
                "disk_total": 0, "disk_used": 0, "disk_usage": 0,
                "net_in": 0, "net_out": 0, "load_1": 0, "load_5": 0, "load_15": 0,
                "uptime": 0, "disk_read_sectors": 0, "disk_write_sectors": 0
            }

            if len(lines) >= 1:
                try:
                    data["cpu_usage"] = round(float(lines[0].strip()), 1)
                except ValueError:
                    pass
            if len(lines) >= 2:
                try:
                    parts = lines[1].split()
                    data["memory_total"] = float(parts[0])
                    data["memory_used"] = float(parts[1])
                    data["memory_usage"] = round(data["memory_used"] / data["memory_total"] * 100, 1) if data["memory_total"] > 0 else 0
                except (ValueError, IndexError):
                    pass
            if len(lines) >= 3:
                try:
                    parts = lines[2].split()
                    data["disk_total"] = float(parts[0].replace('G', ''))
                    data["disk_used"] = float(parts[1].replace('G', ''))
                    data["disk_usage"] = round(data["disk_used"] / data["disk_total"] * 100, 1) if data["disk_total"] > 0 else 0
                except (ValueError, IndexError):
                    pass
            if len(lines) >= 4:
                try:
                    parts = lines[3].split()
                    data["load_1"] = float(parts[0])
                    data["load_5"] = float(parts[1])
                    data["load_15"] = float(parts[2])
                except (ValueError, IndexError):
                    pass
            if len(lines) >= 5:
                try:
                    data["uptime"] = float(lines[4].strip())
                except ValueError:
                    pass
            if len(lines) >= 6:
                try:
                    data["cpu_count"] = int(lines[5].strip())
                except ValueError:
                    pass
            if len(lines) >= 7:
                try:
                    parts = lines[6].split()
                    data["disk_read_sectors"] = int(parts[0])
                    data["disk_write_sectors"] = int(parts[1])
                except (ValueError, IndexError):
                    pass

            return data
        except Exception as e:
            return None
