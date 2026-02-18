"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, KeyRound, Settings, Lock, ShieldCheck, Fingerprint } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"

export function AccessControlPage() {
  const roles = [
    { name: "超级管理员", users: 2, permissions: 48, color: "bg-danger/10 text-danger" },
    { name: "运维工程师", users: 5, permissions: 32, color: "bg-warning/10 text-warning" },
    { name: "开发人员", users: 12, permissions: 18, color: "bg-info/10 text-info" },
    { name: "只读审计员", users: 3, permissions: 8, color: "bg-muted text-muted-foreground" },
  ]

  const users = [
    { name: "张伟", email: "zhangwei@cloud.cn", role: "超级管理员", lastLogin: "2026-02-19 14:30", status: "online", mfa: true },
    { name: "李明", email: "liming@cloud.cn", role: "运维工程师", lastLogin: "2026-02-19 13:45", status: "online", mfa: true },
    { name: "王芳", email: "wangfang@cloud.cn", role: "开发人员", lastLogin: "2026-02-19 10:20", status: "offline", mfa: true },
    { name: "赵磊", email: "zhaolei@cloud.cn", role: "开发人员", lastLogin: "2026-02-18 17:30", status: "offline", mfa: false },
    { name: "刘洋", email: "liuyang@cloud.cn", role: "只读审计员", lastLogin: "2026-02-19 09:00", status: "online", mfa: true },
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((role) => (
          <Card key={role.name} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Badge className={`text-xs border-0 ${role.color}`}>{role.name}</Badge>
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">{role.users}</span>
                <span className="text-xs text-muted-foreground">个用户</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{role.permissions} 项权限</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">用户列表</span>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
              添加用户
            </Button>
          </div>
          <div className="divide-y divide-border">
            {users.map((user) => (
              <div key={user.email} className="flex items-center gap-4 px-5 py-3 hover:bg-secondary/20 transition-colors">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-primary">{user.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{user.name}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${user.status === "online" ? "bg-success" : "bg-muted-foreground/40"}`} />
                  </div>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
                <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">{user.role}</Badge>
                <div className="flex items-center gap-1.5">
                  <Fingerprint className={`w-3.5 h-3.5 ${user.mfa ? "text-success" : "text-muted-foreground/40"}`} />
                  <span className="text-[10px] text-muted-foreground">{user.mfa ? "MFA" : "无MFA"}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{user.lastLogin}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function KeyManagementPage() {
  const keys = [
    { name: "API-Key-Prod", type: "API 密钥", created: "2026-01-15", expires: "2026-07-15", status: "active", lastUsed: "2 分钟前" },
    { name: "SSH-Key-Admin", type: "SSH 密钥", created: "2025-12-01", expires: "2026-06-01", status: "active", lastUsed: "1 小时前" },
    { name: "TLS-Cert-Web", type: "TLS 证书", created: "2026-02-01", expires: "2027-02-01", status: "active", lastUsed: "持续使用" },
    { name: "DB-Cred-Prod", type: "数据库凭证", created: "2026-01-20", expires: "2026-04-20", status: "expiring", lastUsed: "5 分钟前" },
    { name: "JWT-Secret-V2", type: "签名密钥", created: "2026-02-10", expires: "2026-08-10", status: "active", lastUsed: "持续使用" },
    { name: "Old-API-Key", type: "API 密钥", created: "2025-06-01", expires: "2025-12-01", status: "expired", lastUsed: "90 天前" },
  ]

  const statusColors: Record<string, string> = {
    active: "bg-success/10 text-success",
    expiring: "bg-warning/10 text-warning",
    expired: "bg-danger/10 text-danger",
  }

  const statusLabels: Record<string, string> = {
    active: "有效",
    expiring: "即将过期",
    expired: "已过期",
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">有效密钥</p>
              <p className="text-xl font-bold text-foreground">{keys.filter(k => k.status === "active").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">即将过期</p>
              <p className="text-xl font-bold text-foreground">{keys.filter(k => k.status === "expiring").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-danger" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">已过期</p>
              <p className="text-xl font-bold text-foreground">{keys.filter(k => k.status === "expired").length}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">密钥与证书</span>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
              创建密钥
            </Button>
          </div>
          <div className="divide-y divide-border">
            {keys.map((key) => (
              <div key={key.name} className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/20 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground font-mono">{key.name}</span>
                  <p className="text-xs text-muted-foreground">{key.type}</p>
                </div>
                <Badge className={`text-[10px] border-0 ${statusColors[key.status]}`}>
                  {statusLabels[key.status]}
                </Badge>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">过期: {key.expires}</p>
                  <p className="text-[10px] text-muted-foreground/60">最后使用: {key.lastUsed}</p>
                </div>
                <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground text-xs shrink-0">
                  轮换
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function SecuritySettingsPage() {
  const settings = [
    { id: "mfa", name: "多因素认证 (MFA)", description: "要求所有用户启用 MFA 才能访问控制台", enabled: true, category: "认证" },
    { id: "password-policy", name: "强密码策略", description: "密码需包含大小写字母、数字和特殊字符，最少 12 位", enabled: true, category: "认证" },
    { id: "session-timeout", name: "会话超时", description: "用户闲置 30 分钟后自动注销会话", enabled: true, category: "认证" },
    { id: "ip-whitelist", name: "IP 白名单", description: "仅允许白名单 IP 地址访问管理控制台", enabled: false, category: "访问" },
    { id: "brute-force", name: "暴力破解防护", description: "5 次密码错误后自动锁定账户 30 分钟", enabled: true, category: "防护" },
    { id: "auto-ban", name: "自动封禁恶意 IP", description: "检测到攻击行为后自动封禁来源 IP 24 小时", enabled: true, category: "防护" },
    { id: "waf", name: "Web 应用防火墙 (WAF)", description: "启用 WAF 保护 Web 应用免受常见攻击", enabled: true, category: "防护" },
    { id: "ddos", name: "DDoS 防护", description: "启用自动 DDoS 攻击检测和缓解", enabled: true, category: "防护" },
    { id: "log-retention", name: "日志保留 90 天", description: "安全审计日志保留 90 天，超出自动归档", enabled: true, category: "日志" },
    { id: "alert-email", name: "邮件告警通知", description: "检测到高危安全事件时发送邮件告警", enabled: true, category: "告警" },
    { id: "alert-webhook", name: "Webhook 通知", description: "将安全事件通过 Webhook 推送至钉钉/企业微信", enabled: false, category: "告警" },
  ]

  const [settingStates, setSettingStates] = useState(
    Object.fromEntries(settings.map((s) => [s.id, s.enabled]))
  )

  const categories = [...new Set(settings.map((s) => s.category))]

  return (
    <div className="flex flex-col gap-6 p-6">
      {categories.map((category) => (
        <Card key={category} className="bg-card border-border">
          <CardContent className="p-0">
            <div className="px-5 py-3 border-b border-border">
              <span className="text-sm font-medium text-foreground">{category}设置</span>
            </div>
            <div className="divide-y divide-border">
              {settings
                .filter((s) => s.category === category)
                .map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between px-5 py-4 hover:bg-secondary/20 transition-colors">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">{setting.name}</span>
                      <span className="text-xs text-muted-foreground">{setting.description}</span>
                    </div>
                    <Switch
                      checked={settingStates[setting.id]}
                      onCheckedChange={(checked) =>
                        setSettingStates((prev) => ({ ...prev, [setting.id]: checked }))
                      }
                    />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
