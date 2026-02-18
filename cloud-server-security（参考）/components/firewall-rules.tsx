"use client"

import { useState } from "react"
import {
  Plus,
  Search,
  ArrowUpDown,
  MoreHorizontal,
  Trash2,
  Pencil,
  Copy,
  ChevronDown,
  Globe,
  Server,
  X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FirewallRule {
  id: string
  name: string
  direction: "inbound" | "outbound"
  protocol: string
  port: string
  source: string
  action: "allow" | "deny"
  enabled: boolean
  priority: number
  description: string
  hits: number
}

const initialRules: FirewallRule[] = [
  { id: "FR-001", name: "允许 HTTP 流量", direction: "inbound", protocol: "TCP", port: "80", source: "0.0.0.0/0", action: "allow", enabled: true, priority: 100, description: "允许所有入站 HTTP 流量", hits: 24567 },
  { id: "FR-002", name: "允许 HTTPS 流量", direction: "inbound", protocol: "TCP", port: "443", source: "0.0.0.0/0", action: "allow", enabled: true, priority: 101, description: "允许所有入站 HTTPS 流量", hits: 89432 },
  { id: "FR-003", name: "SSH 管理访问", direction: "inbound", protocol: "TCP", port: "22", source: "10.0.0.0/8", action: "allow", enabled: true, priority: 200, description: "仅允许内网 SSH 访问", hits: 1234 },
  { id: "FR-004", name: "阻断恶意 IP", direction: "inbound", protocol: "ALL", port: "*", source: "203.0.113.0/24", action: "deny", enabled: true, priority: 50, description: "阻断已知恶意 IP 段", hits: 5678 },
  { id: "FR-005", name: "数据库访问", direction: "inbound", protocol: "TCP", port: "3306", source: "10.0.1.0/24", action: "allow", enabled: true, priority: 300, description: "仅允许应用服务器访问数据库", hits: 45678 },
  { id: "FR-006", name: "Redis 访问", direction: "inbound", protocol: "TCP", port: "6379", source: "10.0.1.0/24", action: "allow", enabled: true, priority: 301, description: "仅允许应用服务器访问 Redis", hits: 23456 },
  { id: "FR-007", name: "阻断端口扫描", direction: "inbound", protocol: "ALL", port: "*", source: "198.51.100.0/24", action: "deny", enabled: true, priority: 51, description: "阻断端口扫描来源", hits: 890 },
  { id: "FR-008", name: "允许 DNS 出站", direction: "outbound", protocol: "UDP", port: "53", source: "0.0.0.0/0", action: "allow", enabled: true, priority: 100, description: "允许 DNS 查询出站", hits: 156789 },
  { id: "FR-009", name: "NTP 时间同步", direction: "outbound", protocol: "UDP", port: "123", source: "0.0.0.0/0", action: "allow", enabled: true, priority: 102, description: "允许 NTP 出站", hits: 8765 },
  { id: "FR-010", name: "ICMP 禁止", direction: "inbound", protocol: "ICMP", port: "*", source: "0.0.0.0/0", action: "deny", enabled: false, priority: 999, description: "禁止所有 ICMP 流量", hits: 12340 },
]

export function FirewallRules() {
  const [rules, setRules] = useState<FirewallRule[]>(initialRules)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterDirection, setFilterDirection] = useState<"all" | "inbound" | "outbound">("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newRule, setNewRule] = useState({
    name: "",
    direction: "inbound" as "inbound" | "outbound",
    protocol: "TCP",
    port: "",
    source: "",
    action: "allow" as "allow" | "deny",
    priority: 500,
    description: "",
  })

  const filteredRules = rules.filter((rule) => {
    const matchesSearch =
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.source.includes(searchTerm) ||
      rule.port.includes(searchTerm)
    const matchesDirection = filterDirection === "all" || rule.direction === filterDirection
    return matchesSearch && matchesDirection
  })

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    )
  }

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id))
  }

  const addRule = () => {
    const id = `FR-${String(rules.length + 1).padStart(3, "0")}`
    setRules((prev) => [
      ...prev,
      {
        id,
        ...newRule,
        enabled: true,
        hits: 0,
      },
    ])
    setShowAddDialog(false)
    setNewRule({
      name: "",
      direction: "inbound",
      protocol: "TCP",
      port: "",
      source: "",
      action: "allow",
      priority: 500,
      description: "",
    })
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Globe className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">总规则数</p>
                <p className="text-xl font-bold text-foreground">{rules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
                <Server className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">已启用</p>
                <p className="text-xl font-bold text-foreground">{rules.filter((r) => r.enabled).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
                <ArrowUpDown className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">允许规则</p>
                <p className="text-xl font-bold text-foreground">{rules.filter((r) => r.action === "allow").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-danger/10 flex items-center justify-center">
                <X className="w-4 h-4 text-danger" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">拒绝规则</p>
                <p className="text-xl font-bold text-foreground">{rules.filter((r) => r.action === "deny").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border">
                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="搜索规则名称、IP、端口..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-56"
                />
              </div>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-border">
                {(["all", "inbound", "outbound"] as const).map((dir) => (
                  <button
                    key={dir}
                    onClick={() => setFilterDirection(dir)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      filterDirection === dir
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {dir === "all" ? "全部" : dir === "inbound" ? "入站" : "出站"}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={() => setShowAddDialog(true)} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-1" />
              添加规则
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rules Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium text-xs w-20">状态</TableHead>
                <TableHead className="text-muted-foreground font-medium text-xs">规则 ID</TableHead>
                <TableHead className="text-muted-foreground font-medium text-xs">名称</TableHead>
                <TableHead className="text-muted-foreground font-medium text-xs">方向</TableHead>
                <TableHead className="text-muted-foreground font-medium text-xs">协议</TableHead>
                <TableHead className="text-muted-foreground font-medium text-xs">端口</TableHead>
                <TableHead className="text-muted-foreground font-medium text-xs">来源/目标</TableHead>
                <TableHead className="text-muted-foreground font-medium text-xs">动作</TableHead>
                <TableHead className="text-muted-foreground font-medium text-xs text-right">命中次数</TableHead>
                <TableHead className="text-muted-foreground font-medium text-xs w-16">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.map((rule) => (
                <TableRow key={rule.id} className="border-border">
                  <TableCell>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => toggleRule(rule.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono text-muted-foreground">{rule.id}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{rule.name}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-48">{rule.description}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        rule.direction === "inbound"
                          ? "border-primary/30 text-primary bg-primary/5"
                          : "border-warning/30 text-warning bg-warning/5"
                      }`}
                    >
                      {rule.direction === "inbound" ? "入站" : "出站"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono text-foreground">{rule.protocol}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono text-foreground">{rule.port}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono text-muted-foreground">{rule.source}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-[10px] border-0 ${
                        rule.action === "allow"
                          ? "bg-success/10 text-success"
                          : "bg-danger/10 text-danger"
                      }`}
                    >
                      {rule.action === "allow" ? "允许" : "拒绝"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs text-muted-foreground font-mono">
                      {rule.hits.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="p-1.5 rounded-md hover:bg-danger/10 text-muted-foreground hover:text-danger transition-colors cursor-pointer"
                      aria-label="删除规则"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Rule Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">添加防火墙规则</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label className="text-muted-foreground text-xs">规则名称</Label>
              <Input
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                placeholder="例如：允许 HTTPS 流量"
                className="bg-secondary/50 border-border text-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-muted-foreground text-xs">方向</Label>
                <div className="flex gap-2">
                  {(["inbound", "outbound"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setNewRule({ ...newRule, direction: d })}
                      className={`flex-1 px-3 py-2 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                        newRule.direction === d
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-secondary/50 border-border text-muted-foreground"
                      }`}
                    >
                      {d === "inbound" ? "入站" : "出站"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-muted-foreground text-xs">动作</Label>
                <div className="flex gap-2">
                  {(["allow", "deny"] as const).map((a) => (
                    <button
                      key={a}
                      onClick={() => setNewRule({ ...newRule, action: a })}
                      className={`flex-1 px-3 py-2 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                        newRule.action === a
                          ? a === "allow"
                            ? "bg-success/10 border-success/30 text-success"
                            : "bg-danger/10 border-danger/30 text-danger"
                          : "bg-secondary/50 border-border text-muted-foreground"
                      }`}
                    >
                      {a === "allow" ? "允许" : "拒绝"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-muted-foreground text-xs">协议</Label>
                <Input
                  value={newRule.protocol}
                  onChange={(e) => setNewRule({ ...newRule, protocol: e.target.value })}
                  placeholder="TCP / UDP / ALL"
                  className="bg-secondary/50 border-border text-foreground"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-muted-foreground text-xs">端口</Label>
                <Input
                  value={newRule.port}
                  onChange={(e) => setNewRule({ ...newRule, port: e.target.value })}
                  placeholder="80, 443, *"
                  className="bg-secondary/50 border-border text-foreground"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-muted-foreground text-xs">来源 / 目标 CIDR</Label>
              <Input
                value={newRule.source}
                onChange={(e) => setNewRule({ ...newRule, source: e.target.value })}
                placeholder="0.0.0.0/0 或 10.0.0.0/8"
                className="bg-secondary/50 border-border text-foreground"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-muted-foreground text-xs">描述</Label>
              <Input
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                placeholder="规则描述"
                className="bg-secondary/50 border-border text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="border-border text-muted-foreground hover:text-foreground">
              取消
            </Button>
            <Button onClick={addRule} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={!newRule.name || !newRule.port || !newRule.source}>
              创建规则
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
