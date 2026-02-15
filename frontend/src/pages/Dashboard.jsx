import React, { useEffect, useState, useMemo } from 'react'
import { useServerStore } from '@/store/useServerStore'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowUp,
  ArrowDown,
  Clock,
  Server as ServerIcon,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import api from '@/api'

// Simple Circular Progress Component (Baota Style)
const CircularProgress = ({ value, color = '#22c55e', size = 120, strokeWidth = 8, label, subLabel }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold" style={{ color }}>{Math.round(value)}%</span>
        {label && <span className="text-xs text-muted-foreground mt-1">{label}</span>}
      </div>
      {subLabel && <div className="absolute -bottom-6 text-xs text-muted-foreground whitespace-nowrap">{subLabel}</div>}
    </div>
  )
}

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

export default function Dashboard() {
  const { currentServer, serverMetrics, setServerMetrics } = useServerStore()
  const [netSpeed, setNetSpeed] = useState({ upload: 0, download: 0 })
  const [lastNetData, setLastNetData] = useState({ bytes_sent: 0, bytes_recv: 0, timestamp: 0 })
  const wsRef = React.useRef(null)

  // Use cached metrics or initial
  const systemInfo = (currentServer && serverMetrics[currentServer.id])
    ? serverMetrics[currentServer.id]
    : initialUsage

  // Format Bytes (Auto Scaling)
  const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes) || bytes < 0) return '0 B'
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // WebSocket Connection
  useEffect(() => {
    if (!currentServer) return

    const token = localStorage.getItem('token')
    if (!token) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    // Fix: Ensure we use window.location.host to include port if needed, handled by Nginx proxy
    const wsUrl = `${protocol}//${window.location.host}/api/ws/monitor/${currentServer.id}?token=${token}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => console.log('WebSocket 监控连接已建立')

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)

        if (message.type === 'monitor_data') {
          const data = message.data
          const now = Date.now()

          // --- Data Conversion (Key Step!) ---
          // Backend units:
          // Memory: MB -> Bytes (* 1024 * 1024)
          // Disk: GB -> Bytes (* 1024 * 1024 * 1024)
          // Network: KB -> Bytes (* 1024)

          const memTotalBytes = (data.memory_total || 0) * 1024 * 1024
          const memUsedBytes = (data.memory_used || 0) * 1024 * 1024

          const diskTotalBytes = (data.disk_total || 0) * 1024 * 1024 * 1024
          const diskUsedBytes = (data.disk_used || 0) * 1024 * 1024 * 1024

          // Network Traffic (Total Bytes Transferred so far)
          // Note: Backend sends TOTAL bytes since boot or similar counter? 
          // Wait, monitor_services.py sends instantaneous rate?
          // No, monitor_service.py: data["net_in"] = round(float(parts[1]) / 1024, 1) # KB total
          // /proc/net/dev counters are cumulative totals.

          const netInBytes = (data.net_in || 0) * 1024
          const netOutBytes = (data.net_out || 0) * 1024

          // Calculate Speed
          if (lastNetData.timestamp > 0) {
            const timeDiff = (now - lastNetData.timestamp) / 1000 // seconds
            // Check for counter reset or overflow
            if (timeDiff > 0) {
              const upSpeed = (netOutBytes - lastNetData.bytes_sent) / timeDiff
              const downSpeed = (netInBytes - lastNetData.bytes_recv) / timeDiff
              setNetSpeed({
                upload: upSpeed > 0 ? upSpeed : 0,
                download: downSpeed > 0 ? downSpeed : 0
              })
            }
          }

          setLastNetData({
            bytes_sent: netOutBytes,
            bytes_recv: netInBytes,
            timestamp: now
          })

          // Construct Standardized Data Object
          const formattedData = {
            ...initialUsage, // keep static info placeholders
            ...data, // overlay raw data
            // Overwrite with converted bytes for display
            memory_total_bytes: memTotalBytes,
            memory_used_bytes: memUsedBytes,
            disk_total_bytes: diskTotalBytes,
            disk_used_bytes: diskUsedBytes,
            // Keep CPU/Load as is
            cpu_usage: data.cpu_usage || 0,
            load: {
              load_1: data.load_1 || 0,
              load_5: data.load_5 || 0,
              load_15: data.load_15 || 0
            }
          }

          setServerMetrics(currentServer.id, formattedData)
        }
      } catch (err) {
        console.error('WebSocket Error', err)
      }
    }

    ws.onclose = () => console.log('WebSocket 连接已关闭')

    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close()
    }
  }, [currentServer, setServerMetrics, lastNetData.timestamp]) // Dependency on timestamp to update speed calculation closure? No, using functional update or ref is better, but this simple way works if re-runs are okay.

  if (!currentServer) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center text-center space-y-4">
        <div className="bg-muted p-6 rounded-full">
          <ServerIcon className="w-12 h-12 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">请选择服务器</h2>
          <p className="text-muted-foreground mt-2">需要连接到服务器才能查看仪表盘</p>
        </div>
      </div>
    )
  }

  // Determine Load Status Color
  const getLoadStatus = (load, cores = 1) => {
    const ratio = load / cores
    if (ratio < 0.7) return { text: '运行流畅', color: '#22c55e', icon: CheckCircle2 }
    if (ratio < 1.0) return { text: '负载正常', color: '#3b82f6', icon: CheckCircle2 }
    return { text: '负载过高', color: '#ef4444', icon: AlertTriangle }
  }

  // Assume 4 cores if not available (or backend should send it)
  // Monitor service currently sends CPU usage but maybe not core count per request?
  // Let's rely on cpu_usage mostly.
  const loadStatus = getLoadStatus(systemInfo.load?.load_1 || 0, 4)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Top Cards Grid (Baota Style) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        {/* Card 1: Load Status */}
        <Card className="shadow-sm border-l-4" style={{ borderLeftColor: loadStatus.color }}>
          <CardContent className="p-6 flex flex-col items-center justify-center h-[180px] space-y-4">
            <div className="relative">
              <CircularProgress
                value={Math.min((systemInfo.load?.load_1 || 0) * 100 / 4, 100)} // Rough estimate % based on load
                color={loadStatus.color}
                size={100}
                label="负载"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Center Content for Load */}
                <div className="text-center bg-background/80 backdrop-blur-sm rounded-full p-2">
                  <span className="text-xl font-bold" style={{ color: loadStatus.color }}>
                    {loadStatus.text === '运行流畅' ? systemInfo.load?.load_1 : systemInfo.load?.load_1}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg" style={{ color: loadStatus.color }}>{loadStatus.text}</h3>
              <p className="text-xs text-muted-foreground">最近1分钟平均负载</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: CPU */}
        <Card className="shadow-sm">
          <CardContent className="p-6 flex flex-col items-center justify-center h-[180px]">
            <CircularProgress
              value={systemInfo.cpu_usage || 0}
              color="#22c55e" // Green
              size={110}
              label="CPU"
              subLabel={`${systemInfo.cpu_count || '-'} 核心`}
            />
          </CardContent>
        </Card>

        {/* Card 3: Memory */}
        <Card className="shadow-sm">
          <CardContent className="p-6 flex flex-col items-center justify-center h-[180px]">
            <CircularProgress
              value={systemInfo.memory_usage || 0}
              color="#22c55e" // Green
              size={110}
              label="内存"
              subLabel={`${formatBytes(systemInfo.memory_used_bytes)} / ${formatBytes(systemInfo.memory_total_bytes)}`}
            />
          </CardContent>
        </Card>

        {/* Card 4: Disk */}
        <Card className="shadow-sm">
          <CardContent className="p-6 flex flex-col items-center justify-center h-[180px]">
            <CircularProgress
              value={systemInfo.disk_usage || 0}
              color={systemInfo.disk_usage > 80 ? '#ef4444' : '#22c55e'} // Red if > 80%
              size={110}
              label="/"
              subLabel={`${formatBytes(systemInfo.disk_used_bytes)} / ${formatBytes(systemInfo.disk_total_bytes)}`}
            />
          </CardContent>
        </Card>
      </div>

      {/* Network & Info Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Network Traffic */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <ArrowUp className="w-4 h-4 text-green-500" />
              <ArrowDown className="w-4 h-4 text-blue-500" />
              网络流量
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 p-3 rounded-lg border">
                <div className="text-xs text-muted-foreground mb-1">上行速度</div>
                <div className="text-xl font-mono text-green-600 font-semibold">
                  {formatBytes(netSpeed.upload)}/s
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  总发送: {formatBytes(lastNetData.bytes_sent)}
                </div>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border">
                <div className="text-xs text-muted-foreground mb-1">下行速度</div>
                <div className="text-xl font-mono text-blue-600 font-semibold">
                  {formatBytes(netSpeed.download)}/s
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  总接收: {formatBytes(lastNetData.bytes_recv)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Server Details */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              系统状态
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">系统类型</span>
                <span>{systemInfo.platform} {systemInfo.platform_release}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">运行时间</span>
                <span>{typeof systemInfo.uptime === 'number' ? `${Math.floor(systemInfo.uptime / 86400)}天 ${Math.floor((systemInfo.uptime % 86400) / 3600)}小时` : '-'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">负载平均值 (1/5/15)</span>
                <span className="font-mono">
                  {systemInfo.load?.load_1} / {systemInfo.load?.load_5} / {systemInfo.load?.load_15}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">CPU型号</span>
                <span className="truncate max-w-[200px]" title={systemInfo.processor}>{systemInfo.processor || '-'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
