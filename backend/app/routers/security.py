"""安全中心路由 - 真实实现"""
import json
import re
import datetime
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database import SessionLocal
from app.auth import get_current_user
from app.models import Server, OperationLog, AlertLog, MonitorRecord, User
from app.services.ssh_service import SSHService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/security", tags=["security"])
ssh_service = SSHService()

# ─── 依赖 ──────────────────────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── 安全概览 ──────────────────────────────────────────────────────────────────
@router.get("/overview")
async def security_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取安全概览数据（真实）"""
    servers = db.query(Server).filter(Server.is_active == True).all()
    
    # 告警统计（今日）
    today = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_alerts = db.query(AlertLog).filter(AlertLog.created_at >= today).count()
    
    # 操作日志统计
    total_ops = db.query(OperationLog).filter(OperationLog.created_at >= today).count()
    
    # 失败登录（从操作日志中统计）
    failed_logins = db.query(OperationLog).filter(
        OperationLog.created_at >= today,
        OperationLog.action == "login_failed"
    ).count()
    
    # 服务器安全状态
    server_statuses = []
    online_count = 0
    total_score = 0
    
    for s in servers:
        # 从最近的监控记录获取 CPU/内存/磁盘
        latest = db.query(MonitorRecord).filter(
            MonitorRecord.server_id == s.id
        ).order_by(desc(MonitorRecord.created_at)).first()
        
        score = 100
        issues = []
        
        if latest:
            if latest.cpu_usage > 90:
                score -= 15
                issues.append("CPU 使用率过高")
            elif latest.cpu_usage > 80:
                score -= 5
            if latest.memory_usage > 90:
                score -= 15
                issues.append("内存使用率过高")
            elif latest.memory_usage > 80:
                score -= 5
            if latest.disk_usage > 90:
                score -= 20
                issues.append("磁盘空间不足")
            elif latest.disk_usage > 80:
                score -= 10
        
        # 告警数影响评分
        server_alerts = db.query(AlertLog).filter(
            AlertLog.server_id == s.id,
            AlertLog.created_at >= today
        ).count()
        score -= min(server_alerts * 2, 20)
        score = max(score, 0)
        total_score += score
        
        if s.status == "online":
            online_count += 1
        
        server_statuses.append({
            "id": s.id,
            "name": s.name,
            "host": s.host,
            "status": s.status,
            "score": score,
            "issues": issues,
            "cpu_usage": latest.cpu_usage if latest else 0,
            "memory_usage": latest.memory_usage if latest else 0,
            "disk_usage": latest.disk_usage if latest else 0,
        })
    
    avg_score = round(total_score / len(servers)) if servers else 0
    
    # 最近安全事件（操作日志 + 告警日志合并）
    recent_ops = db.query(OperationLog).order_by(
        desc(OperationLog.created_at)
    ).limit(10).all()
    
    recent_alerts = db.query(AlertLog).order_by(
        desc(AlertLog.created_at)
    ).limit(10).all()
    
    events = []
    for op in recent_ops:
        severity = "low"
        event_type = "info"
        if "failed" in op.action or "error" in op.action:
            severity = "high"
            event_type = "blocked"
        elif "delete" in op.action or "remove" in op.action:
            severity = "medium"
            event_type = "warning"
        events.append({
            "id": f"OP-{op.id}",
            "type": event_type,
            "message": f"{op.username} {op.action} {op.target}",
            "detail": op.detail,
            "time": op.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "severity": severity,
        })
    
    for alert in recent_alerts:
        events.append({
            "id": f"AL-{alert.id}",
            "type": "blocked",
            "message": alert.message,
            "detail": f"指标: {alert.metric}, 当前值: {alert.value}, 阈值: {alert.threshold}",
            "time": alert.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "severity": "high" if alert.value > alert.threshold * 1.2 else "medium",
        })
    
    events.sort(key=lambda x: x["time"], reverse=True)
    
    return {
        "score": avg_score,
        "today_alerts": today_alerts,
        "blocked_count": failed_logins,
        "total_operations": total_ops,
        "online_servers": online_count,
        "total_servers": len(servers),
        "servers": server_statuses,
        "events": events[:15],
    }


# ─── 防火墙规则（iptables）──────────────────────────────────────────────────────
@router.get("/firewall")
async def get_firewall_rules(
    server_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """通过 SSH 读取服务器 iptables 规则"""
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(404, "服务器不存在")
    
    try:
        # 获取 iptables 规则（带行号和详细信息）
        out, err = ssh_service.execute_command(
            server,
            "sudo iptables -L -n --line-numbers -v 2>/dev/null || iptables -L -n --line-numbers -v 2>/dev/null"
        )
        
        rules = _parse_iptables(out)
        
        # 获取统计信息
        out2, _ = ssh_service.execute_command(
            server,
            "sudo iptables -L -n -v 2>/dev/null | head -3 || iptables -L -n -v 2>/dev/null | head -3"
        )
        
        return {
            "server_id": server_id,
            "server_name": server.name,
            "rules": rules,
            "raw": out[:3000] if len(out) > 3000 else out,
        }
    except Exception as e:
        logger.error(f"获取防火墙规则失败: {e}")
        raise HTTPException(500, f"获取防火墙规则失败: {str(e)}")


def _parse_iptables(output: str):
    """解析 iptables 输出"""
    rules = []
    current_chain = ""
    rule_id = 0
    
    for line in output.split("\n"):
        line = line.strip()
        if line.startswith("Chain "):
            parts = line.split()
            current_chain = parts[1] if len(parts) > 1 else ""
            continue
        
        if not line or line.startswith("num") or line.startswith("pkts"):
            continue
        
        # 尝试解析规则行: num pkts bytes target prot opt in out source destination ...
        parts = line.split()
        if len(parts) >= 9 and parts[0].isdigit():
            rule_id += 1
            rule = {
                "id": rule_id,
                "num": int(parts[0]),
                "chain": current_chain,
                "pkts": parts[1],
                "bytes": parts[2],
                "action": parts[3],      # ACCEPT / DROP / REJECT
                "protocol": parts[4],    # tcp / udp / all
                "opt": parts[5],
                "in_iface": parts[6],
                "out_iface": parts[7],
                "source": parts[8],
                "destination": parts[9] if len(parts) > 9 else "0.0.0.0/0",
                "extra": " ".join(parts[10:]) if len(parts) > 10 else "",
            }
            
            # 提取端口信息
            port_match = re.search(r'dpt:(\d+)', rule["extra"])
            if port_match:
                rule["port"] = port_match.group(1)
            else:
                rule["port"] = "*"
            
            # 提取多端口
            mport_match = re.search(r'dports\s+([\d,]+)', rule["extra"])
            if mport_match:
                rule["port"] = mport_match.group(1)
            
            # 方向
            rule["direction"] = "inbound" if current_chain == "INPUT" else (
                "outbound" if current_chain == "OUTPUT" else "forward"
            )
            
            rules.append(rule)
    
    return rules


@router.post("/firewall")
async def add_firewall_rule(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """添加 iptables 规则"""
    server = db.query(Server).filter(Server.id == data.get("server_id")).first()
    if not server:
        raise HTTPException(404, "服务器不存在")
    
    chain = "INPUT" if data.get("direction", "inbound") == "inbound" else "OUTPUT"
    action = "ACCEPT" if data.get("action", "allow") == "allow" else "DROP"
    protocol = data.get("protocol", "tcp").lower()
    port = data.get("port", "")
    source = data.get("source", "0.0.0.0/0")
    
    cmd = f"sudo iptables -A {chain}"
    if protocol and protocol != "all":
        cmd += f" -p {protocol}"
    if source and source != "0.0.0.0/0":
        cmd += f" -s {source}"
    if port and port != "*":
        cmd += f" --dport {port}"
    cmd += f" -j {action}"
    
    try:
        out, err = ssh_service.execute_command(server, cmd)
        if err and "error" in err.lower():
            raise HTTPException(400, f"规则添加失败: {err}")
        
        # 保存规则持久化
        ssh_service.execute_command(
            server,
            "sudo sh -c 'iptables-save > /etc/iptables.rules' 2>/dev/null; sudo netfilter-persistent save 2>/dev/null; true"
        )
        
        # 记录操作日志
        db.add(OperationLog(
            user_id=current_user.id,
            username=current_user.username,
            action="add_firewall_rule",
            target=f"{server.name}",
            detail=f"添加规则: {chain} {protocol} {port} {source} -> {action}",
        ))
        db.commit()
        
        return {"success": True, "message": "规则已添加"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"添加规则失败: {str(e)}")


@router.delete("/firewall")
async def delete_firewall_rule(
    server_id: int = Query(...),
    chain: str = Query(...),
    num: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除 iptables 规则"""
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(404, "服务器不存在")
    
    try:
        cmd = f"sudo iptables -D {chain} {num}"
        out, err = ssh_service.execute_command(server, cmd)
        
        # 持久化
        ssh_service.execute_command(
            server,
            "sudo sh -c 'iptables-save > /etc/iptables.rules' 2>/dev/null; sudo netfilter-persistent save 2>/dev/null; true"
        )
        
        db.add(OperationLog(
            user_id=current_user.id,
            username=current_user.username,
            action="delete_firewall_rule",
            target=f"{server.name}",
            detail=f"删除规则: {chain} #{num}",
        ))
        db.commit()
        
        return {"success": True, "message": "规则已删除"}
    except Exception as e:
        raise HTTPException(500, f"删除规则失败: {str(e)}")


# ─── 审计日志（真实）──────────────────────────────────────────────────────────
@router.get("/audit-logs")
async def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: str = Query("all"),
    search: str = Query(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取审计日志（从数据库 OperationLog）"""
    query = db.query(OperationLog)
    
    # 分类筛选
    category_actions = {
        "firewall": ["add_firewall_rule", "delete_firewall_rule", "toggle_firewall_rule"],
        "access": ["login", "logout", "login_failed", "ssh_connect"],
        "security": ["vulnerability_scan", "security_setting_change"],
        "server": ["create_server", "update_server", "delete_server", "test_connection"],
    }
    
    if category != "all" and category in category_actions:
        query = query.filter(OperationLog.action.in_(category_actions[category]))
    
    # 搜索
    if search:
        query = query.filter(
            (OperationLog.action.contains(search)) |
            (OperationLog.username.contains(search)) |
            (OperationLog.target.contains(search)) |
            (OperationLog.detail.contains(search))
        )
    
    total = query.count()
    logs = query.order_by(desc(OperationLog.created_at)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    
    # 分类映射
    action_category_map = {}
    for cat, actions in category_actions.items():
        for a in actions:
            action_category_map[a] = cat
    
    result_logs = []
    for log in logs:
        cat = action_category_map.get(log.action, "server")
        result_type = "success"
        if "failed" in log.action or "error" in log.action:
            result_type = "failure"
        elif "delete" in log.action or "remove" in log.action:
            result_type = "warning"
        
        result_logs.append({
            "id": f"LOG-{log.id:04d}",
            "timestamp": log.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "user": log.username,
            "action": log.action,
            "category": cat,
            "resource": log.target,
            "ip": log.ip_address or "系统",
            "result": result_type,
            "details": log.detail,
        })
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
        "logs": result_logs,
    }


# ─── 漏洞扫描（真实）──────────────────────────────────────────────────────────
@router.post("/vulnerability-scan")
async def run_vulnerability_scan(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """在指定服务器上执行漏洞扫描 - 单次 SSH 连接完成所有检查"""
    server = db.query(Server).filter(Server.id == data.get("server_id")).first()
    if not server:
        raise HTTPException(404, "服务器不存在")
    
    try:
        # 所有检查合并为一个 SSH 命令（避免多次连接超时）
        scan_script = """
echo '===OS_INFO==='
cat /etc/os-release 2>/dev/null | head -3
echo '===UPGRADABLE==='
if command -v apt >/dev/null 2>&1; then
  apt list --upgradable 2>/dev/null | tail -n +2 | head -30 || true
elif command -v yum >/dev/null 2>&1; then
  yum check-update 2>/dev/null | tail -n +3 | head -30 || true
fi
echo '===SSH_CONFIG==='
grep -E '^(PermitRootLogin|PasswordAuthentication|PermitEmptyPasswords|Port |MaxAuthTries)' /etc/ssh/sshd_config 2>/dev/null || true
echo '===FAIL2BAN==='
systemctl is-active fail2ban 2>/dev/null || echo 'inactive'
echo '===END==='
"""
        out, err = ssh_service.execute_command(server, scan_script, timeout=45)
        
        # 解析分段输出
        sections = {}
        current_section = ""
        for line in out.split("\n"):
            line = line.strip()
            if line.startswith("===") and line.endswith("==="):
                current_section = line.strip("=")
                sections[current_section] = []
            elif current_section and line:
                sections[current_section].append(line)
        
        # 解析 OS 信息
        os_info = "\n".join(sections.get("OS_INFO", []))
        is_debian = "debian" in os_info.lower() or "ubuntu" in os_info.lower()
        
        # 解析可升级包
        results = []
        for line in sections.get("UPGRADABLE", []):
            if not line or "Listing" in line:
                continue
            
            if is_debian:
                parts = line.split("/")
                pkg_name = parts[0] if parts else line
                version_info = line.split()
                new_ver = version_info[1] if len(version_info) > 1 else ""
            else:
                parts = line.split()
                if len(parts) < 2:
                    continue
                pkg_name = parts[0]
                new_ver = parts[1]
            
            severity = "low"
            pkg_lower = pkg_name.lower()
            if any(k in pkg_lower for k in ["kernel", "openssl", "openssh", "linux-image", "linux-headers", "glibc"]):
                severity = "high"
            elif any(k in pkg_lower for k in ["nginx", "apache", "httpd", "mysql", "mariadb", "postgresql", "redis", "docker"]):
                severity = "medium"
            elif "secur" in line.lower():
                severity = "high"
            
            results.append({
                "package": pkg_name,
                "current_version": "",
                "new_version": new_ver,
                "severity": severity,
                "status": "open",
                "server": server.name,
                "raw": line,
            })
        
        # 解析 SSH 配置问题
        ssh_issues = []
        for line in sections.get("SSH_CONFIG", []):
            if "PermitRootLogin yes" in line:
                ssh_issues.append({"issue": "SSH 允许 root 直接登录", "severity": "high", "fix": "设置 PermitRootLogin no"})
            if "PasswordAuthentication yes" in line:
                ssh_issues.append({"issue": "SSH 允许密码认证（建议使用密钥）", "severity": "medium", "fix": "设置 PasswordAuthentication no"})
            if "PermitEmptyPasswords yes" in line:
                ssh_issues.append({"issue": "SSH 允许空密码登录", "severity": "critical", "fix": "设置 PermitEmptyPasswords no"})
        
        # 解析 fail2ban
        f2b_lines = sections.get("FAIL2BAN", [])
        f2b_status = " ".join(f2b_lines).lower()
        if "active" not in f2b_status:
            ssh_issues.append({"issue": "fail2ban 未运行（无暴力破解防护）", "severity": "medium", "fix": "安装并启动 fail2ban"})
        
        # 记录操作
        db.add(OperationLog(
            user_id=current_user.id,
            username=current_user.username,
            action="vulnerability_scan",
            target=server.name,
            detail=f"发现 {len(results)} 个待更新包, {len(ssh_issues)} 个配置问题",
        ))
        db.commit()
        
        # 统计
        counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        for r in results:
            counts[r["severity"]] = counts.get(r["severity"], 0) + 1
        for i in ssh_issues:
            counts[i["severity"]] = counts.get(i["severity"], 0) + 1
        
        return {
            "server_id": server.id,
            "server_name": server.name,
            "scan_time": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "packages": results,
            "ssh_issues": ssh_issues,
            "counts": counts,
            "total": len(results) + len(ssh_issues),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"漏洞扫描失败: {e}")
        raise HTTPException(500, f"漏洞扫描失败: {str(e)}")


# ─── 安全设置（真实）──────────────────────────────────────────────────────────
@router.get("/settings")
async def get_security_settings(
    server_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """读取服务器安全设置"""
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(404, "服务器不存在")
    
    try:
        settings = {}
        
        # SSH 配置
        ssh_out, _ = ssh_service.execute_command(
            server,
            "cat /etc/ssh/sshd_config 2>/dev/null | grep -Ev '^#|^$' | head -30"
        )
        ssh_config = {}
        for line in ssh_out.strip().split("\n"):
            parts = line.strip().split(None, 1)
            if len(parts) == 2:
                ssh_config[parts[0]] = parts[1]
        
        settings["permit_root_login"] = ssh_config.get("PermitRootLogin", "yes") != "no"
        settings["password_auth"] = ssh_config.get("PasswordAuthentication", "yes") != "no"
        settings["permit_empty_passwords"] = ssh_config.get("PermitEmptyPasswords", "no") == "yes"
        settings["max_auth_tries"] = int(ssh_config.get("MaxAuthTries", "6"))
        settings["ssh_port"] = int(ssh_config.get("Port", "22"))
        
        # fail2ban 状态
        f2b_out, _ = ssh_service.execute_command(
            server,
            "systemctl is-active fail2ban 2>/dev/null || echo inactive"
        )
        settings["fail2ban_active"] = "active" in f2b_out.strip()
        
        # UFW / firewalld 状态
        ufw_out, _ = ssh_service.execute_command(
            server,
            "ufw status 2>/dev/null | head -1 || firewall-cmd --state 2>/dev/null || echo inactive"
        )
        settings["firewall_active"] = "active" in ufw_out.lower() or "running" in ufw_out.lower()
        
        # SELinux
        sel_out, _ = ssh_service.execute_command(
            server,
            "getenforce 2>/dev/null || echo Disabled"
        )
        settings["selinux"] = sel_out.strip()
        
        # 自动更新
        auto_out, _ = ssh_service.execute_command(
            server,
            "systemctl is-active unattended-upgrades 2>/dev/null || systemctl is-active yum-cron 2>/dev/null || echo inactive"
        )
        settings["auto_update"] = "active" in auto_out.strip()
        
        return {
            "server_id": server_id,
            "server_name": server.name,
            "settings": settings,
        }
    except Exception as e:
        raise HTTPException(500, f"获取安全设置失败: {str(e)}")


@router.put("/settings")
async def update_security_setting(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新服务器安全设置"""
    server = db.query(Server).filter(Server.id == data.get("server_id")).first()
    if not server:
        raise HTTPException(404, "服务器不存在")
    
    key = data.get("key")
    value = data.get("value")
    
    cmd_map = {
        "permit_root_login": {
            True: "sudo sed -i 's/^PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config && sudo systemctl reload sshd",
            False: "sudo sed -i 's/^PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config && sudo grep -q '^PermitRootLogin' /etc/ssh/sshd_config || echo 'PermitRootLogin no' | sudo tee -a /etc/ssh/sshd_config && sudo systemctl reload sshd",
        },
        "password_auth": {
            True: "sudo sed -i 's/^PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config && sudo systemctl reload sshd",
            False: "sudo sed -i 's/^PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config && sudo systemctl reload sshd",
        },
        "fail2ban_active": {
            True: "sudo systemctl start fail2ban && sudo systemctl enable fail2ban",
            False: "sudo systemctl stop fail2ban && sudo systemctl disable fail2ban",
        },
        "firewall_active": {
            True: "sudo ufw --force enable 2>/dev/null || sudo systemctl start firewalld 2>/dev/null || true",
            False: "sudo ufw disable 2>/dev/null || sudo systemctl stop firewalld 2>/dev/null || true",
        },
    }
    
    if key not in cmd_map:
        raise HTTPException(400, f"不支持修改的设置项: {key}")
    
    cmd = cmd_map[key].get(bool(value))
    if not cmd:
        raise HTTPException(400, "无效的值")
    
    try:
        out, err = ssh_service.execute_command(server, cmd, timeout=15)
        
        db.add(OperationLog(
            user_id=current_user.id,
            username=current_user.username,
            action="security_setting_change",
            target=server.name,
            detail=f"修改 {key} = {value}",
        ))
        db.commit()
        
        return {"success": True, "message": f"设置已更新: {key}"}
    except Exception as e:
        raise HTTPException(500, f"更新设置失败: {str(e)}")


# ─── SSH 登录日志（真实）─────────────────────────────────────────────────────
@router.get("/ssh-logs")
async def get_ssh_logs(
    server_id: int = Query(...),
    lines: int = Query(50, ge=10, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """从服务器读取 SSH 登录日志"""
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(404, "服务器不存在")
    
    try:
        out, _ = ssh_service.execute_command(
            server,
            f"grep -E '(sshd|Failed|Accepted|Invalid)' /var/log/auth.log 2>/dev/null | tail -{lines} || "
            f"grep -E '(sshd|Failed|Accepted|Invalid)' /var/log/secure 2>/dev/null | tail -{lines} || "
            f"journalctl -u sshd --no-pager -n {lines} 2>/dev/null || echo 'No SSH logs found'"
        )
        
        entries = []
        for line in out.strip().split("\n"):
            line = line.strip()
            if not line:
                continue
            
            entry_type = "info"
            if "Failed" in line or "Invalid" in line:
                entry_type = "failed"
            elif "Accepted" in line:
                entry_type = "success"
            
            # 尝试提取 IP
            ip_match = re.search(r'from\s+([\d.]+)', line)
            ip = ip_match.group(1) if ip_match else ""
            
            entries.append({
                "raw": line,
                "type": entry_type,
                "ip": ip,
            })
        
        return {
            "server_id": server_id,
            "entries": entries,
        }
    except Exception as e:
        raise HTTPException(500, f"获取 SSH 日志失败: {str(e)}")
