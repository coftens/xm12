import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import {
    Table, TableHeader, TableBody, TableHead, TableRow, TableCell
} from '@/components/ui/table'
import { Plus, Search, Trash2, Globe, Server, X, ArrowUpDown } from 'lucide-react'

const initialRules = [
    { id: 'FR-001', name: '允许 HTTP 流量', direction: 'inbound', protocol: 'TCP', port: '80', source: '0.0.0.0/0', action: 'allow', enabled: true, priority: 100, description: '允许所有入站 HTTP 流量', hits: 24567 },
    { id: 'FR-002', name: '允许 HTTPS 流量', direction: 'inbound', protocol: 'TCP', port: '443', source: '0.0.0.0/0', action: 'allow', enabled: true, priority: 101, description: '允许所有入站 HTTPS 流量', hits: 89432 },
    { id: 'FR-003', name: 'SSH 管理访问', direction: 'inbound', protocol: 'TCP', port: '22', source: '10.0.0.0/8', action: 'allow', enabled: true, priority: 200, description: '仅允许内网 SSH 访问', hits: 1234 },
    { id: 'FR-004', name: '阻断恶意 IP', direction: 'inbound', protocol: 'ALL', port: '*', source: '203.0.113.0/24', action: 'deny', enabled: true, priority: 50, description: '阻断已知恶意 IP 段', hits: 5678 },
    { id: 'FR-005', name: '数据库访问', direction: 'inbound', protocol: 'TCP', port: '3306', source: '10.0.1.0/24', action: 'allow', enabled: true, priority: 300, description: '仅允许应用服务器访问数据库', hits: 45678 },
    { id: 'FR-006', name: 'Redis 访问', direction: 'inbound', protocol: 'TCP', port: '6379', source: '10.0.1.0/24', action: 'allow', enabled: true, priority: 301, description: '仅允许应用服务器访问 Redis', hits: 23456 },
    { id: 'FR-007', name: '阻断端口扫描', direction: 'inbound', protocol: 'ALL', port: '*', source: '198.51.100.0/24', action: 'deny', enabled: true, priority: 51, description: '阻断端口扫描来源', hits: 890 },
    { id: 'FR-008', name: '允许 DNS 出站', direction: 'outbound', protocol: 'UDP', port: '53', source: '0.0.0.0/0', action: 'allow', enabled: true, priority: 100, description: '允许 DNS 查询出站', hits: 156789 },
    { id: 'FR-009', name: 'NTP 时间同步', direction: 'outbound', protocol: 'UDP', port: '123', source: '0.0.0.0/0', action: 'allow', enabled: true, priority: 102, description: '允许 NTP 出站', hits: 8765 },
    { id: 'FR-010', name: 'ICMP 禁止', direction: 'inbound', protocol: 'ICMP', port: '*', source: '0.0.0.0/0', action: 'deny', enabled: false, priority: 999, description: '禁止所有 ICMP 流量', hits: 12340 },
]

export function FirewallRules() {
    const [rules, setRules] = useState(initialRules)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterDirection, setFilterDirection] = useState('all')
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [newRule, setNewRule] = useState({ name: '', direction: 'inbound', protocol: 'TCP', port: '', source: '', action: 'allow', priority: 500, description: '' })

    const filtered = rules.filter(r => {
        const ms = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.source.includes(searchTerm) || r.port.includes(searchTerm)
        const md = filterDirection === 'all' || r.direction === filterDirection
        return ms && md
    })

    const toggleRule = id => setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
    const deleteRule = id => setRules(prev => prev.filter(r => r.id !== id))
    const addRule = () => {
        setRules(prev => [...prev, { id: `FR-${String(prev.length + 1).padStart(3, '0')}`, ...newRule, enabled: true, hits: 0 }])
        setShowAddDialog(false)
        setNewRule({ name: '', direction: 'inbound', protocol: 'TCP', port: '', source: '', action: 'allow', priority: 500, description: '' })
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: '总规则数', value: rules.length, icon: Globe, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: '已启用', value: rules.filter(r => r.enabled).length, icon: Server, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: '允许规则', value: rules.filter(r => r.action === 'allow').length, icon: ArrowUpDown, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: '拒绝规则', value: rules.filter(r => r.action === 'deny').length, icon: X, color: 'text-red-500', bg: 'bg-red-500/10' },
                ].map(s => {
                    const Icon = s.icon
                    return (
                        <Card key={s.label}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}><Icon className={`w-4 h-4 ${s.color}`} /></div>
                                    <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border">
                                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                                <input type="text" placeholder="搜索规则名称、IP、端口..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent text-sm placeholder:text-muted-foreground outline-none w-56" />
                            </div>
                            <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-border">
                                {['all', 'inbound', 'outbound'].map(dir => (
                                    <button key={dir} onClick={() => setFilterDirection(dir)} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filterDirection === dir ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                                        {dir === 'all' ? '全部' : dir === 'inbound' ? '入站' : '出站'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Button onClick={() => setShowAddDialog(true)} size="sm"><Plus className="w-4 h-4 mr-1" />添加规则</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                                {['状态', '规则 ID', '名称', '方向', '协议', '端口', '来源/目标', '动作', '命中次数', '操作'].map(h => (
                                    <TableHead key={h} className="text-muted-foreground font-medium text-xs">{h}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map(rule => (
                                <TableRow key={rule.id} className="border-border">
                                    <TableCell><Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} /></TableCell>
                                    <TableCell><span className="text-xs font-mono text-muted-foreground">{rule.id}</span></TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{rule.name}</span>
                                            <span className="text-xs text-muted-foreground truncate max-w-48">{rule.description}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`text-[10px] ${rule.direction === 'inbound' ? 'border-blue-500/30 text-blue-500 bg-blue-500/5' : 'border-amber-500/30 text-amber-500 bg-amber-500/5'}`}>
                                            {rule.direction === 'inbound' ? '入站' : '出站'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell><span className="text-xs font-mono">{rule.protocol}</span></TableCell>
                                    <TableCell><span className="text-xs font-mono">{rule.port}</span></TableCell>
                                    <TableCell><span className="text-xs font-mono text-muted-foreground">{rule.source}</span></TableCell>
                                    <TableCell>
                                        <Badge className={`text-[10px] border-0 ${rule.action === 'allow' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {rule.action === 'allow' ? '允许' : '拒绝'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right"><span className="text-xs text-muted-foreground font-mono">{rule.hits.toLocaleString()}</span></TableCell>
                                    <TableCell>
                                        <button onClick={() => deleteRule(rule.id)} className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent>
                    <DialogHeader><DialogTitle>添加防火墙规则</DialogTitle></DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs text-muted-foreground">规则名称</label>
                            <input value={newRule.name} onChange={e => setNewRule({ ...newRule, name: e.target.value })} placeholder="例如：允许 HTTPS 流量" className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-muted-foreground">方向</label>
                                <div className="flex gap-2">
                                    {['inbound', 'outbound'].map(d => (
                                        <button key={d} onClick={() => setNewRule({ ...newRule, direction: d })} className={`flex-1 px-3 py-2 rounded-md text-xs font-medium border transition-colors ${newRule.direction === d ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-secondary/50 border-border text-muted-foreground'}`}>
                                            {d === 'inbound' ? '入站' : '出站'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-muted-foreground">动作</label>
                                <div className="flex gap-2">
                                    {['allow', 'deny'].map(a => (
                                        <button key={a} onClick={() => setNewRule({ ...newRule, action: a })} className={`flex-1 px-3 py-2 rounded-md text-xs font-medium border transition-colors ${newRule.action === a ? (a === 'allow' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-red-500/10 border-red-500/30 text-red-500') : 'bg-secondary/50 border-border text-muted-foreground'}`}>
                                            {a === 'allow' ? '允许' : '拒绝'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-muted-foreground">协议</label>
                                <input value={newRule.protocol} onChange={e => setNewRule({ ...newRule, protocol: e.target.value })} placeholder="TCP / UDP / ALL" className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-muted-foreground">端口</label>
                                <input value={newRule.port} onChange={e => setNewRule({ ...newRule, port: e.target.value })} placeholder="80, 443, *" className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs text-muted-foreground">来源 / 目标 CIDR</label>
                            <input value={newRule.source} onChange={e => setNewRule({ ...newRule, source: e.target.value })} placeholder="0.0.0.0/0 或 10.0.0.0/8" className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs text-muted-foreground">描述</label>
                            <input value={newRule.description} onChange={e => setNewRule({ ...newRule, description: e.target.value })} placeholder="规则描述" className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-ring" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>取消</Button>
                        <Button onClick={addRule} disabled={!newRule.name || !newRule.port || !newRule.source}>创建规则</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
