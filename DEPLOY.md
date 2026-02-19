# 服务器远程管理平台 - 部署流程文档

> **重要提醒**：本文档分为两部分，请根据您当前所在的环境选择对应的操作！

> **重要提醒**：本文档分为两部分，请根据您当前所在的环境选择对应的操作！

---

## 🚀 新服务器一键部署 (推荐)

如果你需要在一台全新的服务器上部署本系统，可以使用一键脚本：

1.  **准备工作**
    *   确保服务器是全新的 CentOS 7+ / Ubuntu 20+ / Debian 10+
    *   确保已安装 `git` (如未安装：`apt install git` 或 `yum install git`)

2.  **下载代码**
    ```bash
    mkdir -p /www/wwwroot
    cd /www/wwwroot
    # 请替换为你的实际仓库地址
    git clone <你的Git仓库地址> fwq
    cd fwq
    ```

3.  **运行脚本**
    ```bash
    sudo bash install.sh
    ```
    脚本会自动安装 Python、Nginx，配置虚拟环境和 Systemd 服务。

---

## �️ 新服务器手动部署 (详细步骤)

如果你更喜欢手动控制每个步骤，请按以下顺序执行：

### 1. 安装基础依赖
```bash
# CentOS
yum install -y git python3 python3-pip python3-devel gcc nginx

# Debian/Ubuntu
apt-get update
apt-get install -y git python3 python3-pip python3-venv nginx
```

### 2. 下载代码
```bash
mkdir -p /www/wwwroot
cd /www/wwwroot
git clone <你的Git仓库地址> fwq
cd fwq
```

### 3. 配置后端
```bash
cd backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 初始化数据库 (可选，第一次运行会自动创建)
# python3 -c "from app.database import init_db; init_db()"

# 退出虚拟环境
deactivate
```

### 4. 设置 Systemd 服务 (开机自启)
创建文件 `/etc/systemd/system/server-mgmt-backend.service`：
```ini
[Unit]
Description=Server Management System Backend
After=network.target

[Service]
User=root
WorkingDirectory=/www/wwwroot/fwq/backend
ExecStart=/www/wwwroot/fwq/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
systemctl daemon-reload
systemctl enable server-mgmt-backend
systemctl start server-mgmt-backend
```

### 5. 配置 Nginx
修改 `/etc/nginx/nginx.conf` 或在 `/etc/nginx/conf.d/` 下创建新文件，填入 `install.sh` 中生成的配置内容（参考上文“Nginx WebSocket 配置示例”），确保 `root` 指向 `/www/wwwroot/fwq/frontend/dist`。

然后重启 Nginx：
```bash
nginx -t
systemctl restart nginx
```

部署完成！

---

## �🖥️ 第一部分：本地开发环境（Windows 电脑）

**⚠️ 以下命令只在您的 Windows 电脑上执行，不要在服务器上执行！**

### 前端修改后的操作步骤：

```powershell
# 进入前端目录
cd frontend

# 编译前端代码
npm run build

# 返回项目根目录
cd ..

# ⚠️ 关键步骤：强制添加 dist 文件夹（忽略 .gitignore）
git add -f frontend/dist

# 提交代码（包含源码和编译后的文件）
git add .
git commit -m "描述你的修改内容"

# 推送到远程仓库
git push
```

**为什么要用 `git add -f`？**
- 因为 `.gitignore` 中排除了 `dist/` 文件夹
- 如果不用 `-f` 强制添加，编译后的 JS/CSS 文件不会上传
- 服务器拉取代码后只有 `index.html`，找不到 JS 文件，就会返回 `text/html` MIME type
- 浏览器期望 `application/javascript`，就会报错

#### 后端修改后的操作步骤：

```powershell
# 添加并提交代码
git add .
git commit -m "描述你的修改内容"
git push
```

---

## 🐧 第二部分：服务器端（Linux 服务器）

**⚠️ 以下命令只在您的服务器上执行！服务器端只需要拉取代码，不需要编译、提交或推送！**

### 更新前端代码：

```bash
# 进入前端目录
cd /www/wwwroot/fwq/frontend

# 拉取最新代码（包含编译好的 dist 文件）
git pull

# 完成！浏览器强制刷新（Ctrl + F5）即可看到更新
```

**❌ 服务器上不需要执行**：
- `npm run build`（已经在本地编译好了）
- `git add`、`git commit`、`git push`（服务器只拉取，不提交）

**前端无需重启任何服务**：Nginx 直接读取 `dist/` 文件夹中的静态文件。

---

### 更新并重启后端：

```bash
# 1. 进入后端目录
cd /www/wwwroot/fwq/backend

# 2. 拉取最新代码
git pull

# 3. 查找并杀掉旧进程
ps aux | grep uvicorn
kill <进程ID>

# 4. 激活虚拟环境（如果还没激活）
source venv/bin/activate

# 5. 后台启动后端服务
nohup uvicorn app.main:app --host 127.0.0.1 --port 8000 > uvicorn.log 2>&1 &

# 6. 查看日志确认启动成功
tail -f uvicorn.log

# 看到以下内容表示成功：
# ✅ 默认管理员已创建 (admin / admin123)
# ✅ 监控定时任务已启动（间隔 60 秒）
# INFO:     Started server process [xxxx]
# INFO:     Uvicorn running on http://127.0.0.1:8000

# 按 Ctrl+C 退出日志查看
```

---

## 🚨 常见问题及解决方案

### 问题 1：MIME type 错误

**错误信息**：
```
Failed to load module script: Expected a JavaScript-or-Wasm module script 
but the server responded with a MIME type of "text/html".
```

**原因**：
- 编译后的 JS 文件（如 `index-DfkBRvHU.js`）没有上传到服务器
- `index.html` 引用了不存在的 JS 文件
- Nginx fallback 到 `index.html`，导致浏览器收到 HTML 而不是 JS

**解决方案**：
```powershell
# 本地执行
git add -f frontend/dist
git commit -m "Force add dist folder"
git push

# 服务器执行
cd /www/wwwroot/fwq/frontend
git pull
```

---

### 问题 2：后端启动失败

**常见错误**：
- `ModuleNotFoundError`: 检查导入语句和文件是否存在
- `Address already in use`: 端口 8000 被占用，先 `kill` 旧进程

**调试方法**：
```bash
# 查看后台日志
tail -f /www/wwwroot/fwq/backend/uvicorn.log

# 前台运行（方便查看错误）
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

---

### 问题 3：WebSocket 连接失败

**检查清单**：
1. 后端是否正常运行（检查日志）
2. Nginx 是否正确配置 WebSocket 代理
3. 浏览器控制台是否有连接错误
4. token 是否正确传递

**Nginx WebSocket 配置示例**：
```nginx
# 1. WebSocket 专用配置 (匹配 /api/ws/ 开头的路径)
location /api/ws/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

# 2. 普通 API 配置 (匹配其他 /api/ 开头的路径)
location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    # 注意：这里普通请求不需要 Upgrade 头
}
```

---

## 📝 快速参考命令

### 💻 本地开发（Windows）- 每次前端修改后执行
```powershell
cd frontend && npm run build && cd ..
git add -f frontend/dist
git add .
git commit -m "your message"
git push
```

### 🐧 服务器更新（Linux）- 拉取代码并重启
```bash
# 前端更新（只需 git pull）
cd /www/wwwroot/fwq/frontend && git pull

# 后端更新并重启
cd /www/wwwroot/fwq/backend && git pull
ps aux | grep uvicorn
kill <PID>
nohup uvicorn app.main:app --host 127.0.0.1 --port 8000 > uvicorn.log 2>&1 &
```

---

## 🔧 项目路径速查

| 位置 | 路径 |
|------|------|
| **服务器前端** | `/www/wwwroot/fwq/frontend` |
| **服务器后端** | `/www/wwwroot/fwq/backend` |
| **Nginx 配置** | `/www/server/panel/vhost/nginx/*.conf` |
| **后端日志** | `/www/wwwroot/fwq/backend/uvicorn.log` |
| **本地项目** | `C:\Users\Coftens\Desktop\xiangmu\服务器远程管理平台` |

---

## 📚 技术栈说明

- **前端框架**: React 18 + Vite
- **后端框架**: FastAPI + Python 3.6+
- **Web服务器**: Nginx
- **实时通信**: WebSocket (监控数据推送、SSH终端)
- **数据库**: SQLite
- **部署方式**: 前端静态文件 + 后端 uvicorn 进程

---

**最后提醒**：
- ✅ **本地（Windows）**：编译 → 强制添加 dist → 提交 → 推送
- ✅ **服务器（Linux）**：只拉取代码，不编译不提交！
- ⚠️ **每次修改前端代码后，本地必须执行 `git add -f frontend/dist`！**

---

## 🗄️ 数据库信息

| 项目 | 内容 |
|------|------|
| **类型** | SQLite |
| **文件路径** | `/www/wwwroot/fwq/backend/data/server_mgmt.db` |
| **默认账号** | admin / admin123 |

> ⚠️ **请定期备份数据库文件！删了就没了！**

```bash
# 备份命令
cp /www/wwwroot/fwq/backend/data/server_mgmt.db /backup/server_mgmt_$(date +%Y%m%d).db
```

---

## 🚀 正确的后端重启方法（已验证）

> ⚠️ 必须 `cd` 进入后端目录再启动，否则数据库路径解析失败！

```bash
cd /www/wwwroot/fwq/backend

# 拉取最新代码
git pull

# 杀掉旧进程（一键）
kill $(ps -ef | grep uvicorn | grep -v grep | awk '{print $2}')

# 用 venv 启动（不能用系统 python3！）
nohup ./venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 > output.log 2>&1 &

# 验证启动成功
sleep 3 && curl -s http://127.0.0.1:8000/api/health
```

### 数据库丢失/首次部署时初始化：

```bash
cd /www/wwwroot/fwq/backend
mkdir -p data

./venv/bin/python3 -c "
from app.database import init_db, SessionLocal
from app.models import User
from app.auth import get_password_hash

init_db()
print('建表完成')

db = SessionLocal()
admin = db.query(User).filter(User.username == 'admin').first()
if not admin:
    admin = User(username='admin', hashed_password=get_password_hash('admin123'), role='admin')
    db.add(admin)
    db.commit()
    print('admin 账号已创建')
db.close()
"
```

---

## 🚨 事故复盘（2026-02-19）

### 事故原因

修改后端代码时，将新字段（`platform`, `processor`）加入了 `MonitorData` Pydantic Schema，但**未同步更新数据库模型**，导致连锁崩溃：

1. `schemas.py` 的 `MonitorData` 新增了 `platform`、`processor` 字段
2. `/api/monitor/history` 接口用 `response_model=List[MonitorData]` 从数据库读取记录
3. 数据库表 `monitor_records` 没有这些字段，Pydantic ORM 模式读取时报错
4. 后端崩溃 → 500 / 502

### 解决方案

- 回滚 `schemas.py`，移除多余字段
- 在 `main.py` 中对写入数据库的数据做**防御性字段过滤**（只保留数据库支持的字段）
- 使用正确的 venv uvicorn 启动方式
- 重新创建 `data/` 目录并初始化数据库

### ⚠️ 避坑指南

| 场景 | 正确做法 | 错误做法 |
|------|---------|---------|
| 启动后端 | `cd /www/wwwroot/fwq/backend` 后再启动 | 直接用绝对路径启动（数据库路径会错） |
| 运行 Python | `./venv/bin/uvicorn` 或 `./venv/bin/python3` | `python3`（系统 Python 没有依赖） |
| 修改 Schema | 同步修改 `models.py` 并做数据库迁移 | 只改 Schema 不改数据库模型 |
| 更新代码 | `git pull` + 重启服务 | 只 `git pull` 不重启（旧代码还在内存里） |
