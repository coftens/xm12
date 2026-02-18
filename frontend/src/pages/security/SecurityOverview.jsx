import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, ShieldCheck, AlertTriangle, Activity, Server, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/api'

export function SecurityOverview() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await api.get('/api/security/overview')
            setData(res.data)
        } catch (e) {
            console.error('获取安全概览失败:', e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <RefreshCcw className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">加载安全概览...</span>
                </div>
            </div>
        )
    }

    const scoreColor = data.score >= 80 ? 'text-emerald-500' : data.score >= 60 ? 'text-amber-500' : 'text-red-500'
    const scoreBg = data.score >= 80 ? 'bg-emerald-500/10' : data.score >= 60 ? 'bg-amber-500/10' : 'bg-red-500/10'

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">安全评分</p>
                                <p className={`text-3xl font-bold ${scoreColor}`}>{data.score}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl ${scoreBg} flex items-center justify-center`}>
                                <ShieldCheck className={`w-6 h-6 ${scoreColor}`} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">今日告警</p>
                                <p className="text-3xl font-bold text-amber-500">{data.today_alerts}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-amber-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">失败登录</p>
                                <p className="text-3xl font-bold text-red-500">{data.blocked_count}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-red-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">今日操作</p>
                                <p className="text-3xl font-bold">{data.total_operations}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center">
                                <Activity className="w-6 h-6 text-sky-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 服务器安全状态 */}
            <Card>
                <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold">服务器安全状态</h3>
                        <Badge variant="outline" className="text-xs">
                            {data.online_servers}/{data.total_servers} 在线
                        </Badge>
                    </div>
                    {data.servers.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">暂无已添加的服务器</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {data.servers.map(s => {
                                const sc = s.score >= 80 ? 'text-emerald-500' : s.score >= 60 ? 'text-amber-500' : 'text-red-500'
                                const sbg = s.score >= 80 ? 'bg-emerald-500/10' : s.score >= 60 ? 'bg-amber-500/10' : 'bg-red-500/10'
                                return (
                                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/20 transition-colors">
                                        <div className={`w-10 h-10 rounded-lg ${sbg} flex items-center justify-center shrink-0`}>
                                            <Server className={`w-5 h-5 ${sc}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium truncate">{s.name}</span>
                                                <div className={`status-dot ${s.status === 'online' ? 'online' : 'offline'}`} />
                                            </div>
                                            {/* Resource stats removed as per user request */}
                                            {s.issues.length > 0 && (
                                                <div className="flex gap-1 mt-1 flex-wrap">
                                                    {s.issues.map((issue, i) => (
                                                        <Badge key={i} className="text-[9px] px-1 py-0 h-3.5 bg-red-500/10 text-red-500 border-0">{issue}</Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <span className={`text-lg font-bold ${sc} shrink-0`}>{s.score}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 最近安全事件 */}
            <Card>
                <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold">最近安全事件</h3>
                        <Button variant="outline" size="sm" onClick={fetchData} className="text-xs"><RefreshCcw className="w-3 h-3 mr-1" />刷新</Button>
                    </div>
                    {data.events.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">暂无安全事件</p>
                    ) : (
                        <div className="flex flex-col divide-y divide-border">
                            {data.events.map(event => {
                                const sevColor = event.severity === 'high' ? 'text-red-500 bg-red-500/10' : event.severity === 'medium' ? 'text-amber-500 bg-amber-500/10' : 'text-sky-500 bg-sky-500/10'
                                const sevLabel = event.severity === 'high' ? '高' : event.severity === 'medium' ? '中' : '低'
                                return (
                                    <div key={event.id} className="flex items-center gap-3 py-2.5">
                                        <Badge className={`text-[10px] border-0 shrink-0 ${sevColor}`}>{sevLabel}</Badge>
                                        <span className="text-sm flex-1 min-w-0 truncate">{event.message}</span>
                                        <span className="text-xs text-muted-foreground font-mono shrink-0">{event.time}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
