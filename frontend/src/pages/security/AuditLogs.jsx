import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Download, Shield, User, Key, Calendar, ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react'
import api from '@/api'

const categoryIcons = { firewall: Shield, access: User, security: Key, server: Shield }
const categoryColors = { firewall: 'bg-blue-500/10 text-blue-500', access: 'bg-sky-500/10 text-sky-500', security: 'bg-red-500/10 text-red-500', server: 'bg-amber-500/10 text-amber-500' }
const categoryLabels = { firewall: '防火墙', access: '访问', security: '安全', server: '服务器' }
const resultColors = { success: 'bg-emerald-500/10 text-emerald-500', failure: 'bg-red-500/10 text-red-500', warning: 'bg-amber-500/10 text-amber-500' }
const resultLabels = { success: '成功', failure: '失败', warning: '警告' }

export function AuditLogs() {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [expandedLog, setExpandedLog] = useState(null)

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const res = await api.get('/api/security/audit-logs', {
                params: { page: currentPage, page_size: 15, category: selectedCategory, search: searchTerm }
            })
            setLogs(res.data.logs || [])
            setTotalPages(res.data.total_pages || 1)
            setTotal(res.data.total || 0)
        } catch (e) {
            console.error('获取审计日志失败:', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchLogs() }, [currentPage, selectedCategory])

    const doSearch = () => { setCurrentPage(1); fetchLogs() }

    const exportLogs = () => {
        const csv = ['ID,时间,用户,操作,类别,资源,IP,结果,详情']
        logs.forEach(l => csv.push(`${l.id},${l.timestamp},${l.user},${l.action},${l.category},${l.resource},${l.ip},${l.result},"${l.details}"`))
        const blob = new Blob(['\uFEFF' + csv.join('\n')], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
        link.click()
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border">
                                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                                <input type="text" placeholder="搜索日志..." value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && doSearch()}
                                    className="bg-transparent text-sm placeholder:text-muted-foreground outline-none w-56" />
                            </div>
                            <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-border">
                                {['all', 'firewall', 'access', 'security', 'server'].map(cat => (
                                    <button key={cat} onClick={() => { setSelectedCategory(cat); setCurrentPage(1) }}
                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                                        {cat === 'all' ? '全部' : categoryLabels[cat]}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}><RefreshCcw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />刷新</Button>
                            <Button variant="outline" size="sm" onClick={exportLogs}><Download className="w-3.5 h-3.5 mr-1.5" />导出</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-16"><RefreshCcw className="w-5 h-5 animate-spin text-primary" /><span className="text-sm text-muted-foreground ml-2">加载中...</span></div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <Shield className="w-10 h-10 mb-2 opacity-30" />
                            <span className="text-sm">暂无审计日志</span>
                        </div>
                    ) : (
                        <div className="flex flex-col divide-y divide-border">
                            {logs.map(log => {
                                const Icon = categoryIcons[log.category] || Shield
                                const isExpanded = expandedLog === log.id
                                const colors = (categoryColors[log.category] || '').split(' ')
                                return (
                                    <div key={log.id} className="flex flex-col hover:bg-secondary/20 transition-colors cursor-pointer" onClick={() => setExpandedLog(isExpanded ? null : log.id)}>
                                        <div className="flex items-center gap-4 px-5 py-3.5">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colors[0]}`}>
                                                <Icon className={`w-4 h-4 ${colors[1]}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">{log.action}</span>
                                                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border ${categoryColors[log.category]}`}>
                                                        {categoryLabels[log.category] || log.category}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <span className="text-xs text-muted-foreground">{log.user}</span>
                                                    <span className="text-xs text-muted-foreground/50">|</span>
                                                    <span className="text-xs text-muted-foreground font-mono">{log.ip}</span>
                                                    {log.resource && (<><span className="text-xs text-muted-foreground/50">|</span><span className="text-xs text-muted-foreground">{log.resource}</span></>)}
                                                </div>
                                            </div>
                                            <Badge className={`text-[10px] border-0 shrink-0 ${resultColors[log.result]}`}>{resultLabels[log.result]}</Badge>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground font-mono">{log.timestamp}</span>
                                            </div>
                                        </div>
                                        {isExpanded && log.details && (
                                            <div className="px-5 pb-3.5" style={{ paddingLeft: '4.25rem' }}>
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
                    )}
                </CardContent>
            </Card>

            <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">共 {total} 条记录，第 {currentPage}/{totalPages} 页</span>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 w-8 p-0"><ChevronLeft className="w-4 h-4" /></Button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                        <Button key={page} variant={page === currentPage ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(page)} className="h-8 w-8 p-0">{page}</Button>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 w-8 p-0"><ChevronRight className="w-4 h-4" /></Button>
                </div>
            </div>
        </div>
    )
}
