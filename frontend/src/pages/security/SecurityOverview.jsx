import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    Shield, ShieldAlert, ShieldCheck, Activity,
    TrendingUp, TrendingDown, AlertTriangle, Lock, Globe, Server
} from 'lucide-react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'

const threatData = [
    { time: '00:00', attacks: 12, blocked: 12 }, { time: '02:00', attacks: 8, blocked: 8 },
    { time: '04:00', attacks: 5, blocked: 5 }, { time: '06:00', attacks: 15, blocked: 14 },
    { time: '08:00', attacks: 42, blocked: 41 }, { time: '10:00', attacks: 38, blocked: 37 },
    { time: '12:00', attacks: 55, blocked: 54 }, { time: '14:00', attacks: 48, blocked: 47 },
    { time: '16:00', attacks: 62, blocked: 61 }, { time: '18:00', attacks: 35, blocked: 35 },
    { time: '20:00', attacks: 28, blocked: 27 }, { time: '22:00', attacks: 18, blocked: 18 },
]
const attackTypeData = [
    { type: 'DDoS', count: 156 }, { type: 'SQL注入', count: 89 }, { type: 'XSS', count: 67 },
    { type: '暴力破解', count: 234 }, { type: '端口扫描', count: 178 }, { type: '恶意爬虫', count: 312 },
]
const complianceData = [
    { name: '已合规', value: 87, color: '#10b981' },
    { name: '待修复', value: 8, color: '#f59e0b' },
    { name: '高风险', value: 5, color: '#ef4444' },
]
const recentEvents = [
    { id: 1, type: 'blocked', message: '阻断来自 203.0.113.42 的 DDoS 攻击', time: '2 分钟前', severity: 'high' },
    { id: 2, type: 'warning', message: '检测到异常 SSH 登录尝试 (IP: 198.51.100.7)', time: '5 分钟前', severity: 'medium' },
    { id: 3, type: 'info', message: '防火墙规则 #FR-2847 已更新并生效', time: '12 分钟前', severity: 'low' },
    { id: 4, type: 'blocked', message: '阻断 SQL 注入攻击 (目标: /api/users)', time: '18 分钟前', severity: 'high' },
    { id: 5, type: 'warning', message: 'SSL 证书将在 7 天后过期 (*.example.cn)', time: '25 分钟前', severity: 'medium' },
    { id: 6, type: 'info', message: '安全组 sg-prod-web 规则已同步', time: '32 分钟前', severity: 'low' },
]
const statCards = [
    { title: '安全评分', value: '92', suffix: '/100', change: '+3', trend: 'up', icon: ShieldCheck, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    { title: '今日威胁', value: '366', suffix: '次', change: '-12%', trend: 'down', icon: ShieldAlert, color: 'text-red-500', bgColor: 'bg-red-500/10' },
    { title: '已拦截', value: '359', suffix: '次', change: '98%', trend: 'up', icon: Shield, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { title: '活跃规则', value: '1,284', suffix: '条', change: '+24', trend: 'up', icon: Activity, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
]
const severityColor = { high: 'bg-red-500/10 text-red-500 border-red-500/20', medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20', low: 'bg-blue-500/10 text-blue-500 border-blue-500/20' }
const severityLabel = { high: '高危', medium: '中危', low: '低危' }
const tooltipStyle = { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px', color: '#e2e8f0' }

export function SecurityOverview() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(stat => {
                    const Icon = stat.icon
                    return (
                        <Card key={stat.title}>
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-muted-foreground font-medium">{stat.title}</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-bold">{stat.value}</span>
                                            <span className="text-sm text-muted-foreground">{stat.suffix}</span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-1">
                                            {stat.trend === 'up' ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-emerald-500" />}
                                            <span className="text-xs text-emerald-500">{stat.change}</span>
                                            <span className="text-xs text-muted-foreground">较昨日</span>
                                        </div>
                                    </div>
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${stat.bgColor}`}>
                                        <Icon className={`w-5 h-5 ${stat.color}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium">威胁趋势 (24h)</CardTitle>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-xs text-muted-foreground">攻击次数</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-xs text-muted-foreground">已拦截</span></div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={threatData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="attackGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="blockedGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Area type="monotone" dataKey="attacks" stroke="#ef4444" fill="url(#attackGradient)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="blocked" stroke="#3b82f6" fill="url(#blockedGradient)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">合规状态</CardTitle></CardHeader>
                    <CardContent className="pt-0">
                        <div className="h-48 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={complianceData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" strokeWidth={0}>
                                        {complianceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}%`, '']} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex items-center justify-center gap-4 mt-2">
                            {complianceData.map(item => (
                                <div key={item.name} className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-xs text-muted-foreground">{item.name} {item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">攻击类型分布</CardTitle></CardHeader>
                    <CardContent className="pt-0">
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={attackTypeData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="type" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={60} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium">最近安全事件</CardTitle>
                            <button className="text-xs text-primary hover:text-primary/80 transition-colors">查看全部</button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex flex-col gap-3">
                            {recentEvents.map(event => (
                                <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                                    <div className="mt-0.5">
                                        {event.type === 'blocked' && <ShieldAlert className="w-4 h-4 text-red-500" />}
                                        {event.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                                        {event.type === 'info' && <ShieldCheck className="w-4 h-4 text-blue-500" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm truncate">{event.message}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-muted-foreground">{event.time}</span>
                                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${severityColor[event.severity]}`}>{severityLabel[event.severity]}</Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">服务器安全状态</CardTitle></CardHeader>
                <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { name: 'Web-Prod-01', ip: '10.0.1.10', status: 'safe', score: 96, icon: Globe },
                            { name: 'API-Prod-02', ip: '10.0.1.11', status: 'safe', score: 91, icon: Server },
                            { name: 'DB-Prod-03', ip: '10.0.2.10', status: 'warning', score: 78, icon: Lock },
                            { name: 'Cache-Prod-04', ip: '10.0.2.11', status: 'safe', score: 88, icon: Server },
                        ].map(server => {
                            const Icon = server.icon
                            return (
                                <div key={server.name} className="flex flex-col gap-3 p-4 rounded-lg bg-secondary/30 border border-border">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-medium">{server.name}</span></div>
                                        <div className={`w-2 h-2 rounded-full ${server.status === 'safe' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                    </div>
                                    <span className="text-xs text-muted-foreground font-mono">{server.ip}</span>
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">安全评分</span>
                                            <span className={`text-xs font-semibold ${server.score >= 90 ? 'text-emerald-500' : server.score >= 80 ? 'text-amber-500' : 'text-red-500'}`}>{server.score}</span>
                                        </div>
                                        <Progress value={server.score} className="h-1.5" />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
