import React, { useEffect, useState } from 'react'
import { useServerStore } from '@/store/useServerStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Activity, 
  ArrowUp, 
  ArrowDown, 
  Clock,
  Server
} from 'lucide-react'
import api from '@/api'
import ReactECharts from 'echarts-for-react'

// Mock Data if API fails or initially
const initialUsage = {
  cpu_percent: 0,
  memory: { percent: 0, used: 0, total: 0 },
  disk: { percent: 0, used: 0, total: 0 },
  net_io: { bytes_sent: 0, bytes_recv: 0 },
  uptime: 0
}

export default function Dashboard() {
  const { currentServer, serverMetrics, setServerMetrics } = useServerStore()
  const [netSpeed, setNetSpeed] = useState({ upload: 0, download: 0 })
  const [lastNetData, setLastNetData] = useState({ bytes_sent: 0, bytes_recv: 0, timestamp: 0 })
  const wsRef = React.useRef(null)
  
  // Use cached metrics if available, otherwise default to initialUsage
  const systemInfo = (currentServer && serverMetrics[currentServer.id]) 
    ? serverMetrics[currentServer.id] 
    : initialUsage

  // WebSocket 连接用于实时监控数据
  useEffect(() => {
    if (!currentServer) return

    // 获取 token
    const token = localStorage.getItem('token')
    if (!token) return

    // 构建 WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.hostname}:8000/api/ws/monitor/${currentServer.id}?token=${token}`

    // 创建 WebSocket 连接
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket 监控连接已建立')
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        
        if (message.type === 'monitor_data') {
          const data = message.data
          
          // Calculate network speed (bytes per second)
          const now = Date.now()
          const currentSent = data.net_io?.bytes_sent || 0
          const currentRecv = data.net_io?.bytes_recv || 0
          
          if (lastNetData.timestamp > 0) {
            const timeDiff = (now - lastNetData.timestamp) / 1000 // seconds
            const uploadSpeed = (currentSent - lastNetData.bytes_sent) / timeDiff
            const downloadSpeed = (currentRecv - lastNetData.bytes_recv) / timeDiff
            
            setNetSpeed({
              upload: uploadSpeed > 0 ? uploadSpeed : 0,
              download: downloadSpeed > 0 ? downloadSpeed : 0
            })
          }
          
          setLastNetData({
            bytes_sent: currentSent,
            bytes_recv: currentRecv,
            timestamp: now
          })
          
          // Adapt backend flat structure to frontend nested structure
          const adaptedData = {
            cpu_percent: data.cpu_usage || 0,
            cpu_count: data.cpu_cores || 0,
            memory: { 
              percent: data.memory_usage || 0, 
              used: data.memory_used || 0, 
              total: data.memory_total || 0 
            },
            disk: { 
              percent: data.disk_usage || 0, 
              used: data.disk_used || 0, 
              total: data.disk_total || 0 
            },
            net_io: { 
              bytes_sent: currentSent, 
              bytes_recv: currentRecv
            },
            load: {
              load_1: data.load_1 || 0,
              load_5: data.load_5 || 0,
              load_15: data.load_15 || 0
            },
            uptime: data.uptime || 0
          }

          setServerMetrics(currentServer.id, adaptedData)
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
      console.log('WebSocket 连接已关闭')
    }

    // 重置网络数据
    setLastNetData({ bytes_sent: 0, bytes_recv: 0, timestamp: 0 })
    setNetSpeed({ upload: 0, download: 0 })

    // 清理函数
    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
    }
  }, [currentServer, setServerMetrics])

  if (!currentServer) {
    return (
       <div className="flex h-[400px] flex-col items-center justify-center text-center space-y-4">
         <div className="bg-muted p-6 rounded-full">
            <Server className="w-12 h-12 text-muted-foreground" />
         </div>
         <div>
           <h2 className="text-2xl font-bold">欢迎使用 ServerPanel</h2>
           <p className="text-muted-foreground mt-2">请从"服务器管理"页面选择一台服务器开始管理</p>
         </div>
       </div>
    )
  }

  // Chart Configs
  const getGaugeOption = (value, color, title) => ({
    series: [
      {
        type: 'gauge',
        radius: '90%',
        startAngle: 90,
        endAngle: -270,
        pointer: { show: false },
        progress: {
          show: true,
          overlap: false,
          roundCap: true,
          clip: false,
          itemStyle: { color: color }
        },
        axisLine: { lineStyle: { width: 12, color: [[1, 'rgba(0,0,0,0.1)']] } },
        splitLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        data: [{ value: value, name: title }],
        title: { fontSize: 12, color: '#888', offsetCenter: ['0%', '30%'] },
        detail: {
          width: 50,
          height: 14,
          fontSize: 20,
          color: 'inherit',
          formatter: '{value}%',
          offsetCenter: ['0%', '-10%']
        }
      }
    ]
  })

  // Format Bytes
  const formatBytes = (bytes) => {
    if (!Number.isFinite(bytes) || bytes < 0) return '0 B'
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">仪表盘</h2>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-md">
           <Activity className="w-4 h-4"/>
           <span>实时监控中: {currentServer.name}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* CPU */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU 使用率</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="h-[150px] flex items-center justify-center">
                <ReactECharts 
                   option={getGaugeOption(systemInfo.cpu_percent, '#3b82f6', 'Load')} 
                   style={{height: '100%', width: '100%'}}
                   opts={{ renderer: 'svg' }}
                />
             </div>
             <p className="text-xs text-muted-foreground text-center mt-2">
               {systemInfo.cpu_count} Cores
             </p>
          </CardContent>
        </Card>

        {/* Memory */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">内存使用率</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="h-[150px] flex items-center justify-center">
                <ReactECharts 
                   option={getGaugeOption(systemInfo.memory?.percent || 0, '#8b5cf6', 'RAM')} 
                   style={{height: '100%', width: '100%'}}
                   opts={{ renderer: 'svg' }}
                />
             </div>
             <p className="text-xs text-muted-foreground text-center mt-2">
               {formatBytes(systemInfo.memory?.used)} / {formatBytes(systemInfo.memory?.total)}
             </p>
          </CardContent>
        </Card>

        {/* Disk */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">磁盘使用率</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="h-[150px] flex items-center justify-center">
                <ReactECharts 
                   option={getGaugeOption(systemInfo.disk?.percent || 0, '#10b981', 'Disk')} 
                   style={{height: '100%', width: '100%'}}
                   opts={{ renderer: 'svg' }}
                />
             </div>
             <p className="text-xs text-muted-foreground text-center mt-2">
               {formatBytes(systemInfo.disk?.used)} / {formatBytes(systemInfo.disk?.total)}
             </p>
          </CardContent>
        </Card>

        {/* Network/Info */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">网络 / 负载</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
             <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-green-500">
                   <ArrowUp className="w-4 h-4 mr-1"/>
                   上传
                </div>
                <span className="font-mono">{formatBytes(netSpeed.upload)}/s</span>
             </div>
             <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-blue-500">
                   <ArrowDown className="w-4 h-4 mr-1"/>
                   下载
                </div>
                <span className="font-mono">{formatBytes(netSpeed.download)}/s</span>
             </div>
             <div className="pt-3 border-t border-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                   <span className="text-muted-foreground">负载 (1/5/15min)</span>
                   <span className="font-mono">
                     {systemInfo.load?.load_1?.toFixed(2) || '0.00'} / {systemInfo.load?.load_5?.toFixed(2) || '0.00'} / {systemInfo.load?.load_15?.toFixed(2) || '0.00'}
                   </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                   <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1"/>
                      运行时间
                   </div>
                   <span>{typeof systemInfo.uptime === 'number' ? `${Math.floor(systemInfo.uptime / 3600)} 小时` : systemInfo.uptime}</span>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Process List Placeholder - Could be implemented fully */}
      <h3 className="text-lg font-semibold mt-8">系统信息</h3>
      <Card>
         <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
               <div>
                  <span className="text-muted-foreground">OS:</span> {systemInfo.platform}
               </div>
               <div>
                  <span className="text-muted-foreground">Release:</span> {systemInfo.platform_release}
               </div>
               <div>
                  <span className="text-muted-foreground">Arch:</span> {systemInfo.machine}
               </div>
               <div>
                  <span className="text-muted-foreground">Processor:</span> {systemInfo.processor}
               </div>
            </div>
         </CardContent>
      </Card>
    </div>
  )
}
