#!/bin/bash

# 服务器远程管理平台 - 一键部署脚本
# 支持 OS: Ubuntu/Debian/CentOS/Alibaba Cloud Linux

set -e

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}请使用 root 用户运行此脚本！${NC}"
  echo "示例: sudo bash install.sh"
  exit 1
fi

echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}   服务器远程管理平台 - 一键部署   ${NC}"
echo -e "${GREEN}==========================================${NC}"

# 1. 自动检测系统并安装依赖
echo -e "${YELLOW}[1/6]正在检测系统并安装依赖...${NC}"
if [ -f /etc/debian_version ]; then
    # Debian/Ubuntu
    apt-get update
    apt-get install -y git python3 python3-pip python3-venv nginx curl
elif [ -f /etc/redhat-release ]; then
    # CentOS/RHEL
    yum install -y git python3 python3-pip nginx curl
    # CentOS 可能需要手动安装 python3-devel
    yum install -y python3-devel gcc
else
    echo -e "${RED}不支持的操作系统，请手动安装依赖 (git, python3, nginx)${NC}"
    exit 1
fi

# 2. 准备目录
APP_DIR="/www/wwwroot/fwq"
echo -e "${YELLOW}[2/6] 准备安装目录: ${APP_DIR} ${NC}"

if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}错误：请先将项目代码上传或 git clone 到 ${APP_DIR}${NC}"
    echo "示例："
    echo "mkdir -p /www/wwwroot"
    echo "cd /www/wwwroot"
    echo "git clone <你的仓库地址> fwq"
    exit 1
fi

cd $APP_DIR

# 3. 后端环境配置
echo -e "${YELLOW}[3/6] 配置后端 Python 环境...${NC}"
cd backend

if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "虚拟环境已创建"
fi

source venv/bin/activate
pip install --upgrade pip
# 临时使用清华源，加快国内安装速度
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 初始化数据库
if [ ! -d "data" ]; then
    mkdir -p data
fi

# 运行数据库初始化 (如果需要)
# python3 -c "from app.database import init_db; init_db()"

deactivate
cd ..

# 4. 配置 Systemd 服务
echo -e "${YELLOW}[4/6] 配置后端 Systemd 服务...${NC}"
cat > /etc/systemd/system/server-mgmt-backend.service <<EOF
[Unit]
Description=Server Management System Backend
After=network.target

[Service]
User=root
Group=root
WorkingDirectory=${APP_DIR}/backend
ExecStart=${APP_DIR}/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable server-mgmt-backend
systemctl restart server-mgmt-backend

# 5. 配置 Nginx
echo -e "${YELLOW}[5/6] 配置 Nginx 反向代理...${NC}"

# 获取本机 IP
SERVER_IP=$(curl -s ifconfig.me)

cat > /etc/nginx/conf.d/server_mgmt.conf <<EOF
upstream backend_server_mgmt {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name ${SERVER_IP} _;

    # 前端静态文件
    location / {
        root ${APP_DIR}/frontend/dist;
        try_files \$uri \$uri/ /index.html;
        index index.html;
    }

    # WebSocket 代理
    location /api/ws/ {
        proxy_pass http://backend_server_mgmt;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # 普通 API 代理
    location /api/ {
        proxy_pass http://backend_server_mgmt;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

# 检查 Nginx 配置
nginx -t

# 重启 Nginx
if [ -f /etc/debian_version ]; then
    systemctl restart nginx
else
    # CentOS 有时叫 nginx，有时需要在面板重启
    systemctl restart nginx || /etc/init.d/nginx restart
fi

# 6. 完成
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}   ✅ 部署完成！   ${NC}"
echo -e "${GREEN}==========================================${NC}"
echo -e "访问地址: http://${SERVER_IP}"
echo -e "默认账号: admin"
echo -e "默认密码: admin123"
echo -e "后端服务状态: systemctl status server-mgmt-backend"
echo -e "部署目录: ${APP_DIR}"
