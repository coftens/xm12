import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { useServerStore } from '@/store/useServerStore'
import { Activity, Clock, Layers, Zap } from 'lucide-react'
import api from '@/api'
import { cn } from '@/lib/utils'

const Monitor = () => {
    const currentServer = useServerStore(state => state.currentServer)
    const [duration, setDuration] = useState('1h') // 1h, 6h, 24h
    const [metrics, setMetrics] = useState({ cpu: [], memory: [], disk: [], network: [] })
    const [loading, setLoading] = useState(false)
    const [currentStats, setCurrentStats] = useState({ cpu: 0, memory: 0 })

    // Fetch real-time system stats and build history
    useEffect(() => {
        if (!currentServer) return
        
        const maxPoints = duration === '1h' ? 60 : duration === '6h' ? 120 : 144
        const token = localStorage.getItem('token')
        if (!token) return

        // 构建 WebSocket URL（使用 location.host 包含端口，通过 Nginx 代理）
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const wsUrl = `${protocol}//${window.location.host}/api/ws/monitor/${currentServer.id}?token=${token}`

        // 创建 WebSocket 连接
        const ws = new WebSocket(wsUrl)

        ws.onopen = () => {
            console.log('Monitor WebSocket 连接已建立')
        }

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data)
                
                if (message.type === 'monitor_data') {
                    const data = message.data
                    const cpu = data.cpu_usage || 0
                    const memory = data.memory_usage || 0
                    
                    setCurrentStats({ cpu, memory })
                    
                    const time = dayjs().format('HH:mm:ss')
                    
                    setMetrics(prev => {
                        const newCpu = [...prev.cpu, { name: time, value: [time, cpu] }].slice(-maxPoints)
                        const newMem = [...prev.memory, { name: time, value: [time, memory] }].slice(-maxPoints)
                        return { cpu: newCpu, memory: newMem }
                    })
                } else if (message.type === 'error') {
                    console.error('WebSocket 错误:', message.message)
                }
            } catch (err) {
                console.error('解析 WebSocket 消息失败', err)
            }
        }

        ws.onerror = (error) => {
            console.error('WebSocket 错误:', error)
        }

        ws.onclose = () => {
            console.log('Monitor WebSocket 连接已关闭')
        }

        // 清理函数
        return () => {
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close()
            }
        }
    }, [currentServer, duration])

    const getLineOption = (title, data, color, yAxisMax = 100) => ({
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } }
        },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false },
        yAxis: { type: 'value', max: yAxisMax },
        series: [{
            name: title,
            type: 'line',
            smooth: true,
            symbol: 'none',
            areaStyle: {
                opacity: 0.1,
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: color }, 
                        { offset: 1, color: 'rgba(255, 255, 255, 0)' }
                    ]
                }
            },
            lineStyle: { width: 2, color: color },
            data: data
        }]
    })

    if (!currentServer) {
        return (
            <div className="flex flex-col items-center justify-center -mt-20 h-full">
                <div className="text-center space-y-4 p-12 rounded-lg border border-dashed">
                    <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h2 className="text-xl font-semibold">请先选择服务器</h2>
                    <p className="text-muted-foreground text-sm max-w-sm">
                        在左侧菜单选择一台服务器以查看其历史监控数据
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                     <h2 className="text-2xl font-bold tracking-tight">资源监控历史</h2>
                     <p className="text-muted-foreground text-sm">
                        {currentServer.name} ({currentServer.host}) - 实时性能指标回顾
                     </p>
                </div>
                <div className="flex items-center space-x-2 bg-muted p-1 rounded-lg">
                    {['1h', '6h', '24h', '7d'].map((d) => (
                        <button
                            key={d}
                            onClick={() => setDuration(d)}
                            className={cn(
                                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                duration === d 
                                    ? "bg-background text-foreground shadow-sm" 
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            )}
                        >
                            最近 {d}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                           <Zap className="w-4 h-4 text-orange-500" />
                           CPU 使用率趋势
                        </CardTitle>
                        <span className="text-xs text-muted-foreground">Max: 100%</span>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ReactECharts
                                option={getLineOption('CPU Usage', metrics.cpu, '#f97316')}
                                style={{ height: '100%', width: '100%' }}
                                opts={{ renderer: 'svg' }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                         <CardTitle className="text-sm font-medium flex items-center gap-2">
                           <Layers className="w-4 h-4 text-purple-500" />
                           内存使用率趋势
                        </CardTitle>
                        <span className="text-xs text-muted-foreground">Max: 100%</span>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ReactECharts
                                option={getLineOption('Memory Usage', metrics.memory, '#a855f7')}
                                style={{ height: '100%', width: '100%' }}
                                opts={{ renderer: 'svg' }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Additional Metrics Placeholder */}
             <div className="grid gap-6 md:grid-cols-2">
                <Card className="col-span-1 border-dashed">
                    <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <span>网络流量趋势 (开发中)</span>
                        </div>
                    </CardContent>
                </Card>
                 <Card className="col-span-1 border-dashed">
                     <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <span>磁盘 IO 趋势 (开发中)</span>
                        </div>
                    </CardContent>
                </Card>
             </div>
        </div>
    )
}

export default Monitor
