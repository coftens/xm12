import React, { useEffect, useState, useMemo } from 'react'
import { useServerStore } from '@/store/useServerStore'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowUp,
  ArrowDown,
  Clock,
  Server as ServerIcon,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
  MemoryStick,
  HardDrive
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import api from '@/api'
import { MetricCard } from '@/components/dashboard/MetricCard'


// Initial Mock Data
const initialUsage = {
  cpu_usage: 0,
  cpu_count: 0,
  memory_usage: 0,
  memory_used: 0,
  memory_total: 0,
  disk_usage: 0,
  disk_used: 0,
  disk_total: 0,
  net_in: 0,
  net_out: 0,
  load_1: 0,
  load_5: 0,
  load_15: 0,
  uptime: 0,
  platform: '-',
  platform_release: '-',
  machine: '-',
  processor: '-'
}

// Format Bytes (Auto Scaling)
const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B'
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Component for a Single Server Monitor Card
const ServerMonitorCard = ({ server }) => {
  const { setServerMetrics, serverMetrics } = useServerStore()
  const [netSpeed, setNetSpeed] = useState({ upload: 0, download: 0 })
  const lastNetDataRef = React.useRef({ bytes_sent: 0, bytes_recv: 0, timestamp: 0 })
  const [isConnected, setIsConnected] = useState(false)

  // Use cached metrics or initial
  const systemInfo = (server && serverMetrics[server.id])
    ? serverMetrics[server.id]
    : initialUsage

  useEffect(() => {
    if (!server) return

    const token = localStorage.getItem('token')
    if (!token) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/ws/monitor/${server.id}?token=${token}`

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => setIsConnected(true)

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)

        if (message.type === 'monitor_data') {
          const data = message.data
          const now = Date.now()

          const memTotalBytes = (data.memory_total || 0) * 1024 * 1024
          const memUsedBytes = (data.memory_used || 0) * 1024 * 1024
          const diskTotalBytes = (data.disk_total || 0) * 1024 * 1024 * 1024
          const diskUsedBytes = (data.disk_used || 0) * 1024 * 1024 * 1024
          const netInBytes = (data.net_in || 0) * 1024
          const netOutBytes = (data.net_out || 0) * 1024

          // Calculate Speed using Ref current value
          const lastData = lastNetDataRef.current
          if (lastData.timestamp > 0) {
            const timeDiff = (now - lastData.timestamp) / 1000
            if (timeDiff > 0) {
              const upSpeed = (netOutBytes - lastData.bytes_sent) / timeDiff
              const downSpeed = (netInBytes - lastData.bytes_recv) / timeDiff
              setNetSpeed({
                upload: upSpeed > 0 ? upSpeed : 0,
                download: downSpeed > 0 ? downSpeed : 0
              })
            }
          }

          // Update Ref
          lastNetDataRef.current = {
            bytes_sent: netOutBytes,
            bytes_recv: netInBytes,
            timestamp: now
          }

          const formattedData = {
            ...initialUsage,
            ...data,
            memory_total_bytes: memTotalBytes,
            memory_used_bytes: memUsedBytes,
            disk_total_bytes: diskTotalBytes,
            disk_used_bytes: diskUsedBytes,
            cpu_usage: data.cpu_usage || 0,
            load: {
              load_1: data.load_1 || 0,
              load_5: data.load_5 || 0,
              load_15: data.load_15 || 0
            }
          }

          setServerMetrics(server.id, formattedData)
        }
      } catch (err) {
        console.error('WebSocket Error', err)
      }
    }

    ws.onclose = () => setIsConnected(false)

    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close()
    }
  }, [server.id, setServerMetrics])

  return (
    <Card className="overflow-hidden border-t-4 shadow-sm" style={{ borderTopColor: isConnected ? '#3b82f6' : '#9ca3af' }}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <ServerIcon className={`w-5 h-5 ${isConnected ? 'text-blue-500' : 'text-gray-400'}`} />
            <div>
              <h3 className="font-bold text-lg leading-none">{server.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{server.host}</p>
            </div>
          </div>
          <div className={`text-xs px-2 py-0.5 rounded-full ${isConnected ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
            {isConnected ? '在线' : '离线'}
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MetricCard
            title="CPU"
            value={`${systemInfo.cpu_usage || 0}`}
            unit="%"
            percentage={systemInfo.cpu_usage || 0}
            icon={<div className="i-lucide-cpu text-blue-500" />} // Using div wrapper if icon logic expects component, but MetricCard expects node. 
            // Wait, standard Lucide icons are components. Let's pass the component instance or element.
            // MetricCard uses {icon} directly.
            icon={<Cpu className="size-5 text-blue-500" />}
            color="bg-blue-500/10"
          />
          <MetricCard
            title="内存"
            value={`${Math.round(systemInfo.memory_usage || 0)}`}
            unit="%"
            percentage={systemInfo.memory_usage || 0}
            icon={<div className="i-lucide-memory-stick text-purple-500" />} // Wait, let's stick to the imports
            icon={<MemoryStick className="size-5 text-purple-500" />}
            color="bg-purple-500/10"
          />
          <MetricCard
            title="磁盘"
            value={`${Math.round(systemInfo.disk_usage || 0)}`}
            unit="%"
            percentage={systemInfo.disk_usage || 0}
            icon={<HardDrive className="size-5 text-yellow-500" />}
            color="bg-yellow-500/10"
          />
        </div>

        {/* Network & Uptime Footer */}
        <div className="bg-muted/30 -mx-4 -mb-4 p-3 mt-2 border-t text-xs flex justify-between items-center text-muted-foreground">
          <div className="flex gap-3">
            <div className="flex items-center gap-1" title="上传速度">
              <ArrowUp className="w-3 h-3 text-blue-500" />
              <span className="font-mono text-foreground/80">{formatBytes(netSpeed.upload)}/s</span>
            </div>
            <div className="flex items-center gap-1" title="下载速度">
              <ArrowDown className="w-3 h-3 text-cyan-500" />
              <span className="font-mono text-foreground/80">{formatBytes(netSpeed.download)}/s</span>
            </div>
          </div>
          <div className="flex items-center gap-1 truncate" title="系统运行时间">
            <Clock className="w-3 h-3" />
            <span>{typeof systemInfo.uptime === 'number' ? `${Math.floor(systemInfo.uptime / 86400)}天 ` : ''}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const { servers, currentServer, fetchServers, setCurrentServer } = useServerStore()

  // Ensure we have the latest server list on mount
  useEffect(() => {
    fetchServers()
  }, [fetchServers])

  // Select the first server if none selected (optional logic, maybe not needed for dashboard view)
  useEffect(() => {
    if (servers.length > 0 && !currentServer) {
      setCurrentServer(servers[0])
    }
  }, [servers, currentServer, setCurrentServer])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">服务器看板</h2>
        <Button variant="outline" size="sm" onClick={() => fetchServers()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新列表
        </Button>
      </div>

      {servers.length === 0 ? (
        <div className="flex h-[400px] flex-col items-center justify-center text-center space-y-4 border-2 border-dashed rounded-lg">
          <div className="bg-muted p-6 rounded-full">
            <ServerIcon className="w-12 h-12 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold">暂无服务器</h2>
            <p className="text-muted-foreground mt-2">请先添加服务器以查看监控数据</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
          {servers.map(server => (
            <ServerMonitorCard key={server.id} server={server} />
          ))}
        </div>
      )}
    </div>
  )
}
