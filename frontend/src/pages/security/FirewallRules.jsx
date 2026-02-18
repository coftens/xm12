import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Plus, Trash2, Shield, ArrowDownToLine, ArrowUpFromLine, RefreshCcw, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import api from '@/api'

export function FirewallRules() {
    const [servers, setServers] = useState([])
    const [selectedServerId, setSelectedServerId] = useState(null)
    const [rules, setRules] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [dirFilter, setDirFilter] = useState('all')
    const [showAdd, setShowAdd] = useState(false)
    const [newRule, setNewRule] = useState({ direction: 'inbound', protocol: 'tcp', port: '', source: '0.0.0.0/0', action: 'allow' })

    // 加载服务器列表
    useEffect(() => {
        const fetchServers = async () => {
            try {
                const res = await api.get('/api/servers')
                setServers(res.data)
                if (res.data.length > 0) setSelectedServerId(res.data[0].id)
            } catch (e) {
                console.error(e)
            }
        }
        fetchServers()
    }, [])

    // 加载防火墙规则
    const fetchRules = async () => {
        if (!selectedServerId) return
        setLoading(true)
        try {
            const res = await api.get(`/api/security/firewall?server_id=${selectedServerId}`)
            setRules(res.data.rules || [])
        } catch (e) {
            console.error('获取防火墙规则失败:', e)
            setRules([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { if (selectedServerId) fetchRules() }, [selectedServerId])

    const addRule = async () => {
        try {
            await api.post('/api/security/firewall', { server_id: selectedServerId, ...newRule })
            setShowAdd(false)
            setNewRule({ direction: 'inbound', protocol: 'tcp', port: '', source: '0.0.0.0/0', action: 'allow' })
            fetchRules()
        } catch (e) {
            alert(e.response?.data?.detail || '添加失败')
        }
    }

    const deleteRule = async (chain, num) => {
        if (!confirm('确定删除此规则？')) return
        try {
            await api.delete(`/api/security/firewall?server_id=${selectedServerId}&chain=${chain}&num=${num}`)
            fetchRules()
        } catch (e) {
            alert(e.response?.data?.detail || '删除失败')
        }
    }

    const filtered = rules.filter(r => {
        if (dirFilter !== 'all' && r.direction !== dirFilter) return false
        if (searchTerm) {
            const s = searchTerm.toLowerCase()
            return (r.action || '').toLowerCase().includes(s) || (r.protocol || '').toLowerCase().includes(s) || (r.source || '').includes(s) || (r.port || '').includes(s)
        }
        return true
    })

    const stats = {
        total: rules.length,
        input: rules.filter(r => r.chain === 'INPUT').length,
        output: rules.filter(r => r.chain === 'OUTPUT').length,
        accept: rules.filter(r => r.action === 'ACCEPT').length,
        drop: rules.filter(r => r.action === 'DROP' || r.action === 'REJECT').length,
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* 服务器选择 */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-medium text-muted-foreground">选择服务器:</span>
                        <div className="flex items-center gap-2 flex-wrap">
                            {servers.map(s => (
                                <button key={s.id} onClick={() => setSelectedServerId(s.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedServerId === s.id ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:text-foreground border border-border'}`}>
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 统计 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                    { label: '总规则', value: stats.total, color: 'text-primary' },
                    { label: 'INPUT', value: stats.input, color: 'text-sky-500' },
                    { label: 'OUTPUT', value: stats.output, color: 'text-amber-500' },
                    { label: 'ACCEPT', value: stats.accept, color: 'text-emerald-500' },
                    { label: 'DROP/REJECT', value: stats.drop, color: 'text-red-500' },
                ].map(s => (
                    <Card key={s.label}>
                        <CardContent className="p-3 text-center">
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* 工具栏 */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border">
                                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                                <input type="text" placeholder="搜索规则..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent text-sm placeholder:text-muted-foreground outline-none w-40" />
                            </div>
                            <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-border">
                                {['all', 'inbound', 'outbound'].map(d => (
                                    <button key={d} onClick={() => setDirFilter(d)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${dirFilter === d ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                                        {d === 'all' ? '全部' : d === 'inbound' ? 'INPUT' : 'OUTPUT'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={fetchRules} disabled={loading}><RefreshCcw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />刷新</Button>
                            <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-3.5 h-3.5 mr-1" />添加规则</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 规则表格 */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-16"><RefreshCcw className="w-5 h-5 animate-spin text-primary" /><span className="text-sm text-muted-foreground ml-2">加载中...</span></div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <Shield className="w-10 h-10 mb-2 opacity-30" />
                            <span className="text-sm">{rules.length === 0 ? '暂无防火墙规则' : '没有匹配的规则'}</span>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">#</TableHead>
                                    <TableHead>链</TableHead>
                                    <TableHead>协议</TableHead>
                                    <TableHead>动作</TableHead>
                                    <TableHead>源地址</TableHead>
                                    <TableHead>目标地址</TableHead>
                                    <TableHead>端口</TableHead>
                                    <TableHead className="text-right">命中</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map(rule => (
                                    <TableRow key={`${rule.chain}-${rule.num}`}>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{rule.num}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`text-[10px] ${rule.chain === 'INPUT' ? 'border-sky-500/20 text-sky-500 bg-sky-500/5' : 'border-amber-500/20 text-amber-500 bg-amber-500/5'}`}>
                                                {rule.chain}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs font-mono">{rule.protocol}</TableCell>
                                        <TableCell>
                                            <Badge className={`text-[10px] border-0 ${rule.action === 'ACCEPT' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {rule.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs font-mono">{rule.source}</TableCell>
                                        <TableCell className="text-xs font-mono">{rule.destination}</TableCell>
                                        <TableCell className="text-xs font-mono">{rule.port}</TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground">{rule.pkts}</TableCell>
                                        <TableCell>
                                            <button onClick={() => deleteRule(rule.chain, rule.num)} className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* 添加规则弹窗 */}
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>添加防火墙规则</DialogTitle></DialogHeader>
                    <div className="flex flex-col gap-4 py-2">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">方向</label>
                            <div className="flex gap-2">
                                {['inbound', 'outbound'].map(d => (
                                    <button key={d} onClick={() => setNewRule(r => ({ ...r, direction: d }))}
                                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${newRule.direction === d ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
                                        {d === 'inbound' ? '入站 (INPUT)' : '出站 (OUTPUT)'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">协议</label>
                            <select value={newRule.protocol} onChange={e => setNewRule(r => ({ ...r, protocol: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                                <option value="tcp">TCP</option>
                                <option value="udp">UDP</option>
                                <option value="all">ALL</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">端口</label>
                            <input type="text" placeholder="如 80, 443, 8080" value={newRule.port} onChange={e => setNewRule(r => ({ ...r, port: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground outline-none" />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">源地址</label>
                            <input type="text" placeholder="0.0.0.0/0" value={newRule.source} onChange={e => setNewRule(r => ({ ...r, source: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground outline-none" />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">动作</label>
                            <div className="flex gap-2">
                                {['allow', 'deny'].map(a => (
                                    <button key={a} onClick={() => setNewRule(r => ({ ...r, action: a }))}
                                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${newRule.action === a ? (a === 'allow' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-red-500 text-white border-red-500') : 'border-border text-muted-foreground'}`}>
                                        {a === 'allow' ? 'ACCEPT (允许)' : 'DROP (拒绝)'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Button onClick={addRule} className="mt-2">添加规则</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
