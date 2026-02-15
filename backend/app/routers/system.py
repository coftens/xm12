"""系统信息、进程管理、服务管理路由"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Server, User
from app.auth import get_current_user
from app.services.ssh_service import SSHService

router = APIRouter(prefix="/api/system", tags=["系统管理"])


@router.get("/{server_id}/info")
async def get_system_info(
    server_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取系统详细信息（宝塔风格）"""
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="服务器不存在")

    ssh = SSHService()
    cmd = """
echo "===HOSTNAME==="
hostname
echo "===OS==="
cat /etc/os-release 2>/dev/null | grep -E "^PRETTY_NAME=" | cut -d'"' -f2
echo "===KERNEL==="
uname -r
echo "===ARCH==="
uname -m
echo "===UPTIME==="
uptime -p 2>/dev/null || uptime
echo "===UPTIME_SINCE==="
uptime -s 2>/dev/null
echo "===CPU_MODEL==="
grep "model name" /proc/cpuinfo | head -1 | cut -d: -f2
echo "===CPU_CORES==="
nproc
echo "===MEMORY==="
free -b | grep Mem
echo "===SWAP==="
free -b | grep Swap
echo "===DISK==="
df -B1 --total 2>/dev/null | grep -E "^/|total"
echo "===LOAD==="
cat /proc/loadavg
echo "===CPU_USAGE==="
grep 'cpu ' /proc/stat | awk '{usage=($2+$4)*100/($2+$4+$5)} END {print usage}'
echo "===NETWORK_IPS==="
ip -4 addr show 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1'
echo "===BOOT_TIME==="
who -b 2>/dev/null | awk '{print $3, $4}'
"""
    try:
        stdout, _ = ssh.execute_command(server, cmd, timeout=15)
        info = _parse_system_info(stdout)

        # 更新服务器状态
        server.status = "online"
        db.commit()

        return info
    except Exception as e:
        server.status = "offline"
        db.commit()
        raise HTTPException(status_code=500, detail=f"获取系统信息失败: {str(e)}")


def _parse_system_info(output: str) -> dict:
    """解析系统信息"""
    info = {
        "hostname": "",
        "os": "",
        "kernel": "",
        "arch": "",
        "uptime": "",
        "uptime_since": "",
        "cpu_model": "",
        "cpu_cores": 0,
        "memory_total": 0,
        "memory_used": 0,
        "memory_free": 0,
        "memory_usage": 0,
        "swap_total": 0,
        "swap_used": 0,
        "swap_usage": 0,
        "disks": [],
        "disk_total": 0,
        "disk_used": 0,
        "disk_usage": 0,
        "load_1": 0,
        "load_5": 0,
        "load_15": 0,
        "cpu_usage": 0,
        "ips": [],
        "boot_time": "",
    }

    sections = output.split("===")
    for i, section in enumerate(sections):
        section = section.strip()
        if i + 1 >= len(sections):
            continue
        val = sections[i + 1].strip().split('\n')[0].strip()

        if section == "HOSTNAME":
            info["hostname"] = val
        elif section == "OS":
            info["os"] = val
        elif section == "KERNEL":
            info["kernel"] = val
        elif section == "ARCH":
            info["arch"] = val
        elif section == "UPTIME":
            info["uptime"] = val.replace("up ", "")
        elif section == "UPTIME_SINCE":
            info["uptime_since"] = val
        elif section == "CPU_MODEL":
            info["cpu_model"] = val.strip()
        elif section == "CPU_CORES":
            try:
                info["cpu_cores"] = int(val)
            except ValueError:
                pass
        elif section == "MEMORY":
            try:
                parts = val.split()
                info["memory_total"] = int(parts[1])
                info["memory_used"] = int(parts[2])
                info["memory_free"] = int(parts[3])
                if info["memory_total"] > 0:
                    info["memory_usage"] = round(info["memory_used"] / info["memory_total"] * 100, 1)
            except (ValueError, IndexError):
                pass
        elif section == "SWAP":
            try:
                parts = val.split()
                info["swap_total"] = int(parts[1])
                info["swap_used"] = int(parts[2])
                if info["swap_total"] > 0:
                    info["swap_usage"] = round(info["swap_used"] / info["swap_total"] * 100, 1)
            except (ValueError, IndexError):
                pass
        elif section == "DISK":
            disk_lines = sections[i + 1].strip().split('\n')
            disks = []
            for dl in disk_lines:
                dparts = dl.split()
                if len(dparts) >= 6:
                    disk_item = {
                        "filesystem": dparts[0],
                        "total": int(dparts[1]) if dparts[1].isdigit() else 0,
                        "used": int(dparts[2]) if dparts[2].isdigit() else 0,
                        "available": int(dparts[3]) if dparts[3].isdigit() else 0,
                        "mount": dparts[5] if len(dparts) > 5 else ""
                    }
                    if disk_item["total"] > 0:
                        disk_item["usage"] = round(disk_item["used"] / disk_item["total"] * 100, 1)
                    else:
                        disk_item["usage"] = 0

                    if dparts[0] == "total":
                        info["disk_total"] = disk_item["total"]
                        info["disk_used"] = disk_item["used"]
                        info["disk_usage"] = disk_item["usage"]
                    else:
                        disks.append(disk_item)
            info["disks"] = disks
        elif section == "LOAD":
            try:
                parts = val.split()
                info["load_1"] = float(parts[0])
                info["load_5"] = float(parts[1])
                info["load_15"] = float(parts[2])
            except (ValueError, IndexError):
                pass
        elif section == "CPU_USAGE":
            try:
                info["cpu_usage"] = round(float(val), 1)
            except ValueError:
                pass
        elif section == "NETWORK_IPS":
            info["ips"] = [ip.strip() for ip in sections[i + 1].strip().split('\n') if ip.strip()]
        elif section == "BOOT_TIME":
            info["boot_time"] = val

    return info


@router.get("/{server_id}/processes")
async def list_processes(
    server_id: int,
    sort: str = "cpu",  # cpu / mem / pid
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取进程列表"""
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="服务器不存在")

    ssh = SSHService()

    sort_key = {
        "cpu": "-%cpu",
        "mem": "-%mem",
        "pid": "pid"
    }.get(sort, "-%cpu")

    cmd = f'ps aux --sort={sort_key} | head -51'
    stdout, _ = ssh.execute_command(server, cmd)

    processes = []
    lines = stdout.strip().split('\n')
    if len(lines) < 2:
        return {"processes": []}

    for line in lines[1:]:  # 跳过表头
        parts = line.split(None, 10)
        if len(parts) >= 11:
            processes.append({
                "user": parts[0],
                "pid": int(parts[1]) if parts[1].isdigit() else 0,
                "cpu": float(parts[2]) if parts[2].replace('.', '').isdigit() else 0,
                "mem": float(parts[3]) if parts[3].replace('.', '').isdigit() else 0,
                "vsz": parts[4],
                "rss": parts[5],
                "stat": parts[7],
                "start": parts[8],
                "time": parts[9],
                "command": parts[10],
            })

    return {"processes": processes}


@router.post("/{server_id}/processes/{pid}/kill")
async def kill_process(
    server_id: int,
    pid: int,
    signal: int = 9,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """结束进程"""
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="服务器不存在")

    ssh = SSHService()
    cmd = f'kill -{signal} {pid} 2>&1'
    stdout, stderr = ssh.execute_command(server, cmd)

    return {"message": f"信号 {signal} 已发送到进程 {pid}", "output": stdout + stderr}


@router.get("/{server_id}/services")
async def list_services(
    server_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取系统服务列表"""
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="服务器不存在")

    ssh = SSHService()
    cmd = 'systemctl list-units --type=service --all --no-pager --no-legend 2>/dev/null | head -100'
    stdout, _ = ssh.execute_command(server, cmd)

    services = []
    for line in stdout.strip().split('\n'):
        if not line.strip():
            continue
        parts = line.split(None, 4)
        if len(parts) >= 4:
            name = parts[0].replace('.service', '').strip()
            if name.startswith('●'):
                name = name[1:].strip()
            services.append({
                "name": name,
                "load": parts[1] if len(parts) > 1 else "",
                "active": parts[2] if len(parts) > 2 else "",
                "sub": parts[3] if len(parts) > 3 else "",
                "description": parts[4] if len(parts) > 4 else "",
            })

    return {"services": services}


@router.post("/{server_id}/services/{name}/{action}")
async def control_service(
    server_id: int,
    name: str,
    action: str,  # start / stop / restart / enable / disable
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """控制系统服务"""
    if action not in ('start', 'stop', 'restart', 'enable', 'disable', 'status'):
        raise HTTPException(status_code=400, detail="不支持的操作")

    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="服务器不存在")

    ssh = SSHService()
    cmd = f'systemctl {action} {name} 2>&1'
    stdout, stderr = ssh.execute_command(server, cmd)

    return {"message": f"服务 {name} {action} 完成", "output": stdout + stderr}


@router.get("/{server_id}/network")
async def get_network_info(
    server_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取网络信息"""
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="服务器不存在")

    ssh = SSHService()
    cmd = """
echo "===CONNECTIONS==="
ss -tuln 2>/dev/null | tail -n +2
echo "===INTERFACES==="
ip -s link show 2>/dev/null
"""
    stdout, _ = ssh.execute_command(server, cmd)

    sections = stdout.split("===")
    result = {"connections": [], "interfaces": []}

    for i, section in enumerate(sections):
        section = section.strip()
        if section == "CONNECTIONS" and i + 1 < len(sections):
            for line in sections[i + 1].strip().split('\n'):
                parts = line.split()
                if len(parts) >= 5:
                    result["connections"].append({
                        "protocol": parts[0],
                        "state": parts[1],
                        "recv_q": parts[2],
                        "send_q": parts[3],
                        "local": parts[4],
                        "peer": parts[5] if len(parts) > 5 else "",
                    })

    return result


@router.get("/{server_id}/crontab")
async def get_crontab(
    server_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取定时任务"""
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="服务器不存在")

    ssh = SSHService()
    cmd = 'crontab -l 2>/dev/null'
    stdout, stderr = ssh.execute_command(server, cmd)

    tasks = []
    for line in stdout.strip().split('\n'):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        parts = line.split(None, 5)
        if len(parts) >= 6:
            tasks.append({
                "minute": parts[0],
                "hour": parts[1],
                "day": parts[2],
                "month": parts[3],
                "weekday": parts[4],
                "command": parts[5],
                "raw": line,
            })

    return {"tasks": tasks, "raw": stdout}


@router.post("/{server_id}/crontab")
async def save_crontab(
    server_id: int,
    content: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """保存定时任务"""
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(status_code=404, detail="服务器不存在")

    import base64
    content_b64 = base64.b64encode(content.encode()).decode()
    ssh = SSHService()
    cmd = f'echo "{content_b64}" | base64 -d | crontab -'
    _, stderr = ssh.execute_command(server, cmd)

    if stderr:
        raise HTTPException(status_code=500, detail=f"保存失败: {stderr}")

    return {"message": "定时任务已保存"}
