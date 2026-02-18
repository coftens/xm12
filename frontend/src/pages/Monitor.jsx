import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import dayjs from 'dayjs'
import { useServerStore } from '@/store/useServerStore'
import { Activity, Clock, Layers, Zap, Network, HardDrive } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ResourceChart } from '@/components/dashboard/ResourceChart'
import { DualResourceChart } from '@/components/dashboard/DualResourceChart'
import ServerSwitcher from '@/components/ServerSwitcher'

const Monitor = () => {
    const currentServer = useServerStore(state => state.currentServer)
    const [chartData, setChartData] = useState([])
    const [currentStats, setCurrentStats] = useState({
        cpu: 0,
        memory: 0,
        net_in: 0,
        net_out: 0,
        disk_read: 0,
        disk_write: 0
    })

    // Previous data for rate calculation
    const prevStatsRef = useRef(null)
    const maxPoints = 60

    // WebSocket for real-time updates
    useEffect(() => {
        if (!currentServer) return

        const token = localStorage.getItem('token')
        if (!token) return

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const wsUrl = `${protocol}//${window.location.host}/api/ws/monitor/${currentServer.id}?token=${token}`

        const ws = new WebSocket(wsUrl)

        ws.onopen = () => {
            console.log('Monitor WebSocket 连接已建立')
            // Reset chart and prev stats on new connection/server change
            setChartData([])
            prevStatsRef.current = null
        }

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data)

                if (message.type === 'monitor_data') {
                    const data = message.data
                    const now = dayjs()
                    const timestamp = now.valueOf()
                    const time = now.format('HH:mm:ss')

                    const current = {
                        timestamp,
                        cpu: data.cpu_usage || 0,
                        memory: data.memory_usage || 0,
                        net_in_total: data.net_in || 0, // KB (Cumulative)
                        net_out_total: data.net_out || 0, // KB (Cumulative)
                        disk_read_total: data.disk_read_sectors || 0, // sectors (Cumulative)
                        disk_write_total: data.disk_write_sectors || 0, // sectors (Cumulative)
                    }

                    let net_in_rate = 0
                    let net_out_rate = 0
                    let disk_read_rate = 0
                    let disk_write_rate = 0

                    if (prevStatsRef.current) {
                        const timeDiff = (timestamp - prevStatsRef.current.timestamp) / 1000 // seconds

                        if (timeDiff > 0) {
                            // Net (KB)
                            // Handle wrap-around or reset? Usually counters increase. 
                            // If diff < 0, maybe restart, treat as 0.
                            const netInDiff = current.net_in_total - prevStatsRef.current.net_in_total
                            const netOutDiff = current.net_out_total - prevStatsRef.current.net_out_total
                            net_in_rate = netInDiff >= 0 ? parseFloat((netInDiff / timeDiff).toFixed(1)) : 0
                            net_out_rate = netOutDiff >= 0 ? parseFloat((netOutDiff / timeDiff).toFixed(1)) : 0

                            // Disk (Sectors -> KB) 1 sector = 512 bytes = 0.5 KB
                            const diskReadDiff = (current.disk_read_total - prevStatsRef.current.disk_read_total) * 0.5
                            const diskWriteDiff = (current.disk_write_total - prevStatsRef.current.disk_write_total) * 0.5
                            disk_read_rate = diskReadDiff >= 0 ? parseFloat((diskReadDiff / timeDiff).toFixed(1)) : 0
                            disk_write_rate = diskWriteDiff >= 0 ? parseFloat((diskWriteDiff / timeDiff).toFixed(1)) : 0
                        }
                    }

                    prevStatsRef.current = current

                    setCurrentStats({
                        cpu: current.cpu,
                        memory: current.memory,
                        net_in: net_in_rate,
                        net_out: net_out_rate,
                        disk_read: disk_read_rate,
                        disk_write: disk_write_rate
                    })

                    setChartData(prev => {
                        const newData = [...prev, {
                            time,
                            cpu: current.cpu,
                            memory: current.memory,
                            net_in: net_in_rate,
                            net_out: net_out_rate,
                            disk_read: disk_read_rate,
                            disk_write: disk_write_rate
                        }]
                        if (newData.length > maxPoints) {
                            return newData.slice(newData.length - maxPoints)
                        }
                        return newData
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
    }, [currentServer])

    if (!currentServer) {
        return (
            <div className="flex flex-col items-center justify-center -mt-20 h-full">
                <div className="text-center space-y-4 p-12 rounded-lg border border-dashed">
                    <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h2 className="text-xl font-semibold">请先选择服务器</h2>
                    <p className="text-muted-foreground text-sm max-w-sm">
                        选择一台服务器以查看其实时监控数据
                    </p>
                    <ServerSwitcher />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">资源监控</h2>
                    <p className="text-muted-foreground text-sm">
                        {currentServer.name} ({currentServer.host}) - 实时性能指标
                    </p>
                </div>
                <ServerSwitcher />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="col-span-1">
                    <ResourceChart
                        title="CPU 使用率 (%)"
                        data={chartData}
                        dataKey="cpu"
                        colorVar="--chart-1"
                        icon={Zap}
                        iconColorClass="text-orange-500"
                    />
                </div>
                <div className="col-span-1">
                    <ResourceChart
                        title="内存使用率 (%)"
                        data={chartData}
                        dataKey="memory"
                        colorVar="--chart-2"
                        icon={Layers}
                        iconColorClass="text-purple-500"
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="col-span-1">
                    <DualResourceChart
                        title="网络流量 (KB/s)"
                        data={chartData}
                        key1="net_in"
                        label1="下行"
                        key2="net_out"
                        label2="上行"
                        colorVar1="--chart-3"
                        colorVar2="--chart-4"
                        icon={Network}
                        iconColorClass="text-blue-500"
                    />
                </div>
                <div className="col-span-1">
                    <DualResourceChart
                        title="磁盘 IO (KB/s)"
                        data={chartData}
                        key1="disk_read"
                        label1="读取"
                        key2="disk_write"
                        label2="写入"
                        colorVar1="--chart-5"
                        colorVar2="--chart-2"
                        icon={HardDrive}
                        iconColorClass="text-green-500"
                    />
                </div>
            </div>
        </div>
    )
}
export default Monitor
