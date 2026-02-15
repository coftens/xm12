# 服务器远程管理平台

轻量级 Web 版服务器远程管理平台，面向个人/小团队使用。

## 功能特性

- **服务器资产管理**：增删改查服务器信息，凭证加密存储
- **Web SSH 终端**：基于 xterm.js 的浏览器内 SSH 终端
- **服务器监控**：CPU、内存、磁盘、网络实时/历史监控
- **批量操作**：批量执行命令、上传/下载文件
- **用户权限**：管理员/普通用户角色控制
- **操作日志**：完整的操作审计日志

## 技术栈

- **前端**：Vue 3 + Element Plus + xterm.js
- **后端**：Python FastAPI + Paramiko
- **数据库**：SQLite
- **部署**：Docker Compose

## 快速开始

### Docker 部署（推荐）

```bash
# 修改 docker-compose.yml 中的密钥
docker-compose up -d
```

访问 http://localhost 即可使用。

### 手动部署

**后端：**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**前端：**
```bash
cd frontend
npm install
npm run dev    # 开发模式
npm run build  # 生产构建
```

## 默认账号

- 用户名：admin
- 密码：admin123

> 首次登录后请立即修改密码！
