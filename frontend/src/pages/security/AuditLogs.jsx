import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Download, Shield, User, Key, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

const auditLogs = [
    { id: 'LOG-001', timestamp: '2026-02-19 14:32:18', user: 'admin@cloud.cn', action: '更新防火墙规则', category: 'firewall', resource: 'FR-002', ip: '10.0.1.5', result: 'success', details: '将端口范围从 80 修改为 80,8080' },
    { id: 'LOG-002', timestamp: '2026-02-19 14:28:05', user: 'ops@cloud.cn', action: 'SSH 登录', category: 'access', resource: 'Web-Prod-01', ip: '10.0.1.100', result: 'success', details: '通过密钥认证登录服务器' },
    { id: 'LOG-003', timestamp: '2026-02-19 14:15:42', user: 'unknown', action: '暴力破解尝试', category: 'security', resource: 'API-Prod-02', ip: '203.0.113.42', result: 'failure', details: 'SSH 密码认证失败 15 次，已自动封禁' },
    { id: 'LOG-004', timestamp: '2026-02-19 13:58:30', user: 'admin@cloud.cn', action: '创建安全组', category: 'security', resource: 'sg-new-api', ip: '10.0.1.5', result: 'success', details: '为新 API 服务创建安全组' },
    { id: 'LOG-005', timestamp: '2026-02-19 13:45:12', user: 'dev@cloud.cn', action: '密钥轮换', category: 'keys', resource: 'API-Key-Prod', ip: '10.0.1.50', result: 'success', details: '生产环境 API 密钥已轮换' },
    { id: 'LOG-006', timestamp: '2026-02-19 13:30:00', user: 'admin@cloud.cn', action: '用户权限变更', category: 'access', resource: 'dev@cloud.cn', ip: '10.0.1.5', result: 'success', details: '授予数据库只读权限' },
    { id: 'LOG-007', timestamp: '2026-02-19 13:12:55', user: 'system', action: '漏洞扫描完成', category: 'security', resource: '全部服务器', ip: '系统', result: 'warning', details: '发现 3 个中危漏洞，5 个低危漏洞' },
    { id: 'LOG-008', timestamp: '2026-02-19 12:58:18', user: 'ops@cloud.cn', action: 'SSL 证书更新', category: 'security', resource: '*.example.cn', ip: '10.0.1.100', result: 'success', details: 'SSL 证书续期成功，有效期至 2027-02-19' },
    { id: 'LOG-009', timestamp: '2026-02-19 12:45:30', user: 'unknown', action: 'SQL 注入尝试', category: 'security', resource: '/api/users', ip: '198.51.100.7', result: 'failure', details: "WAF 已拦截，攻击载荷: ' OR 1=1--" },
    { id: 'LOG-010', timestamp: '2026-02-19 12:30:00', user: 'admin@cloud.cn', action: '删除过期规则', category: 'firewall', resource: 'FR-OLD-15', ip: '10.0.1.5', result: 'success', details: '清理 30 天未命中的过期防火墙规则' },
    { id: 'LOG-011', timestamp: '2026-02-19 12:15:22', user: 'ops@cloud.cn', action: '服务器重启', category: 'access', resource: 'Cache-Prod-04', ip: '10.0.1.100', result: 'success', details: 'Redis 缓存服务器计划内重启' },
    { id: 'LOG-012', timestamp: '2026-02-19 11:58:40', user: 'system', action: '自动封禁 IP', category: 'security', resource: '防火墙', ip: '系统', result: 'success', details: '自动封禁 IP 45.33.32.0/24，触发规则：端口扫描检测' },
]

const categoryIcons = { firewall: Shield, access: User, security: Key, keys: Key }
const categoryColors = { firewall: 'bg-blue-500/10 text-blue-500 border-blue-500/20', access: 'bg-sky-500/10 text-sky-500 border-sky-500/20', security: 'bg-red-500/10 text-red-500 border-red-500/20', keys: 'bg-amber-500/10 text-amber-500 border-amber-500/20' }
const categoryLabels = { firewall: '防火墙', access: '访问', security: '安全', keys: '密钥' }
const resultColors = { success: 'bg-emerald-500/10 text-emerald-500', failure: 'bg-red-500/10 text-red-500', warning: 'bg-amber-500/10 text-amber-500' }
const resultLabels = { success: '成功', failure: '失败', warning: '警告' }

export function AuditLogs() {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [expandedLog, setExpandedLog] = useState(null)
    const perPage = 8

    const filtered = auditLogs.filter(log => {
        const ms = log.action.toLowerCase().includes(searchTerm.toLowerCase()) || log.user.toLowerCase().includes(searchTerm.toLowerCase()) || log.resource.toLowerCase().includes(searchTerm.toLowerCase())
        const mc = selectedCategory === 'all' || log.category === selectedCategory
        return ms && mc
    })

    const totalPages = Math.ceil(filtered.length / perPage)
    const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

    return (
        <div className="flex flex-col gap-6 p-6">
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border">
                                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                                <input type="text" placeholder="搜索日志..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1) }} className="bg-transparent text-sm placeholder:text-muted-foreground outline-none w-56" />
                            </div>
                            <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-border">
                                {['all', 'firewall', 'access', 'security', 'keys'].map(cat => (
                                    <button key={cat} onClick={() => { setSelectedCategory(cat); setCurrentPage(1) }} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                                        {cat === 'all' ? '全部' : categoryLabels[cat]}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Button variant="outline" size="sm"><Download className="w-3.5 h-3.5 mr-1.5" />导出日志</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <div className="flex flex-col divide-y divide-border">
                        {paginated.map(log => {
                            const Icon = categoryIcons[log.category] || Shield
                            const isExpanded = expandedLog === log.id
                            const catColor = categoryColors[log.category] || ''
                            const [bg, text] = catColor.split(' ')
                            return (
                                <div key={log.id} className="flex flex-col hover:bg-secondary/20 transition-colors cursor-pointer" onClick={() => setExpandedLog(isExpanded ? null : log.id)}>
                                    <div className="flex items-center gap-4 px-5 py-3.5">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                                            <Icon className={`w-4 h-4 ${text}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">{log.action}</span>
                                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border ${catColor}`}>{categoryLabels[log.category]}</Badge>
                                            </div>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="text-xs text-muted-foreground">{log.user}</span>
                                                <span className="text-xs text-muted-foreground/50">|</span>
                                                <span className="text-xs text-muted-foreground font-mono">{log.ip}</span>
                                                <span className="text-xs text-muted-foreground/50">|</span>
                                                <span className="text-xs text-muted-foreground">{log.resource}</span>
                                            </div>
                                        </div>
                                        <Badge className={`text-[10px] border-0 shrink-0 ${resultColors[log.result]}`}>{resultLabels[log.result]}</Badge>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <Calendar className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground font-mono">{log.timestamp}</span>
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div className="px-5 pb-3.5 pl-17">
                                            <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                                                <p className="text-xs text-muted-foreground"><span className="text-foreground font-medium">详情：</span>{log.details}</p>
                                                <p className="text-xs text-muted-foreground mt-1"><span className="text-foreground font-medium">日志 ID：</span><span className="font-mono">{log.id}</span></p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">共 {filtered.length} 条记录，第 {currentPage}/{totalPages} 页</span>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 w-8 p-0"><ChevronLeft className="w-4 h-4" /></Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <Button key={page} variant={page === currentPage ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(page)} className="h-8 w-8 p-0">{page}</Button>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 w-8 p-0"><ChevronRight className="w-4 h-4" /></Button>
                </div>
            </div>
        </div>
    )
}
