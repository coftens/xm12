# 服务器远程管理平台 - 部署流程文档

> **重要提醒**：每次修改前端代码后，必须按照此流程操作，否则会出现 MIME type 错误！

## 📋 完整部署流程（每次必须执行）

### 1. 本地开发环境（Windows）

#### 前端修改后的操作步骤：

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

### 2. 服务器端（Linux）

#### 更新前端代码：

```bash
# 进入前端目录
cd /www/wwwroot/fwq/frontend

# 拉取最新代码（包含编译好的 dist 文件）
git pull

# 强制刷新浏览器（Ctrl + F5）
```

**前端无需重启任何服务**：Nginx 直接读取 `dist/` 文件夹中的静态文件。

---

#### 更新并重启后端：

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
location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

---

## 📝 快速参考命令

### 本地开发（每次前端修改后）
```powershell
cd frontend && npm run build && cd ..
git add -f frontend/dist
git add .
git commit -m "your message"
git push
```

### 服务器更新
```bash
# 前端
cd /www/wwwroot/fwq/frontend && git pull

# 后端
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

**最后提醒**：每次修改前端代码后，都必须 `git add -f frontend/dist` ！
