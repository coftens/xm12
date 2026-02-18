import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { useServerStore } from '@/store/useServerStore'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import api from '@/api'
import {
  Terminal as TerminalIcon, Plus, Search, Server, ChevronRight, Circle,
  Lock, Key, Clock, MoreHorizontal, Pencil, Trash2, Copy, X,
  PanelLeftClose, PanelLeft, Maximize2, Minimize2, Wifi, WifiOff,
  Zap, Shield, HardDrive, Cpu, RefreshCw, FolderOpen
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

// ===================== 会话计时器 =====================
function SessionTimer({ active }) {
  const [time, setTime] = useState('00:00:00')
  useEffect(() => {
    if (!active) { setTime('00:00:00'); return }
    const start = Date.now()
    const iv = setInterval(() => {
      const e = Math.floor((Date.now() - start) / 1000)
      const h = String(Math.floor(e / 3600)).padStart(2, '0')
      const m = String(Math.floor((e % 3600) / 60)).padStart(2, '0')
      const s = String(e % 60).padStart(2, '0')
      setTime(`${h}:${m}:${s}`)
    }, 1000)
    return () => clearInterval(iv)
  }, [active])
  return <span className="font-mono tabular-nums">{time}</span>
}

// ===================== 状态栏 =====================
function StatusBar({ server, session, sessionCount }) {
  return (
    <footer className="flex h-6 items-center justify-between border-t border-border bg-card px-3 text-[10px] text-muted-foreground shrink-0">
      <div className="flex items-center gap-3">
        {server && session ? (
          <>
            <div className="flex items-center gap-1">
              <Wifi className={cn('size-2.5', session.status === 'connected' ? 'text-emerald-500' : 'text-muted-foreground')} />
              <span>{session.status === 'connected' ? '已连接' : '已断开'}</span>
            </div>
            <div className="w-px h-3 bg-border" />
            <span className="font-mono">SSH-2.0</span>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-1"><TerminalIcon className="size-2.5" /><span>bash</span></div>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-1"><Cpu className="size-2.5" /><span>UTF-8</span></div>
          </>
        ) : <span>无活动连接</span>}
      </div>
      <div className="flex items-center gap-3">
        {server && <><div className="flex items-center gap-1"><HardDrive className="size-2.5" /><span className="font-mono">{server.host}:{server.port}</span></div><div className="w-px h-3 bg-border" /></>}
        <div className="flex items-center gap-1"><Clock className="size-2.5" /><SessionTimer active={session?.status === 'connected'} /></div>
        <div className="w-px h-3 bg-border" />
        <span>{sessionCount} 个会话</span>
      </div>
    </footer>
  )
}

// ===================== 会话标签 =====================
function SessionTabs({ sessions, activeSessionId, onSessionSelect, onSessionClose }) {
  if (sessions.length === 0) return null
  return (
    <div className="flex items-center gap-0 bg-card border-b border-border overflow-x-auto shrink-0">
      {sessions.map(session => (
        <div key={session.id}
          className={cn('group flex items-center gap-2 border-r border-border px-3 py-2 text-xs cursor-pointer transition-colors min-w-0 max-w-[200px]',
            activeSessionId === session.id ? 'bg-[#1e1e1e] text-foreground border-b-2 border-b-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}
          onClick={() => onSessionSelect(session.id)}>
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Circle className={cn('size-2 flex-shrink-0 fill-current', session.status === 'connected' ? 'text-emerald-500' : 'text-muted-foreground')} />
            <TerminalIcon className="size-3 flex-shrink-0" />
            <span className="truncate font-medium">{session.serverName}</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={e => { e.stopPropagation(); onSessionClose(session.id) }}
                className="flex size-4 flex-shrink-0 items-center justify-center rounded-sm opacity-0 transition-opacity hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100">
                <X className="size-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>关闭会话</TooltipContent>
          </Tooltip>
        </div>
      ))}
    </div>
  )
}

// ===================== 顶部 Header =====================
function TerminalHeader({ server, session, sidebarCollapsed, isFullscreen, onToggleSidebar, onToggleFullscreen, onReconnect }) {
  return (
    <header className="flex h-11 items-center justify-between border-b border-border bg-card px-3 shrink-0">
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" onClick={onToggleSidebar}>
              {sidebarCollapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}</TooltipContent>
        </Tooltip>

        {/* Logo */}
        <div className="flex items-center gap-2 mr-2">
          <div className="flex size-6 items-center justify-center rounded bg-primary/20">
            <span className="text-xs font-bold text-primary font-mono">&gt;_</span>
          </div>
          <span className="text-sm font-semibold text-foreground hidden sm:inline">SSH 终端</span>
        </div>

        {/* Server Info */}
        {server && (
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className={cn('flex items-center gap-1.5', session?.status === 'connected' ? 'text-emerald-500' : 'text-muted-foreground')}>
              {session?.status === 'connected' ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground leading-none">{server.name}</span>
              <span className="text-[10px] text-muted-foreground font-mono leading-tight">{server.username}@{server.host}:{server.port}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        {session?.status !== 'connected' && server && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" onClick={onReconnect}>
                <RefreshCw className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>重新连接</TooltipContent>
          </Tooltip>
        )}
        <div className="w-px h-5 bg-border mx-1" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" onClick={onToggleFullscreen}>
              {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isFullscreen ? '退出全屏' : '全屏'}</TooltipContent>
        </Tooltip>
      </div>
    </header>
  )
}

// ===================== 空状态 =====================
function EmptyTerminal({ onNewConnection, servers, onServerSelect }) {
  const hasServers = servers.length > 0
  return (
    <div className="flex h-full flex-col items-center justify-center bg-[#1e1e1e] px-6">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
          <TerminalIcon className="size-8 text-primary" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-white">欢迎使用 SSH 终端</h2>
        <p className="mb-8 text-sm text-zinc-400 leading-relaxed">
          {hasServers ? '从左侧选择一台服务器开始连接，或新建连接。' : '还没有添加任何服务器，点击下方按钮添加第一台服务器。'}
        </p>

        <Button onClick={onNewConnection} className="mb-10 gap-2 h-10 px-5">
          <Plus className="size-4" />
          {hasServers ? '新建连接' : '添加服务器'}
        </Button>

        {/* Features */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-sm mb-10">
          {[{ icon: Zap, label: '多会话' }, { icon: Shield, label: '加密传输' }, { icon: Clock, label: '历史记录' }].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-800"><Icon className="size-4 text-primary" /></div>
              <span className="text-[11px] text-zinc-500">{label}</span>
            </div>
          ))}
        </div>

        {/* Quick Tips */}
        <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 w-full text-left">
          <p className="text-xs font-medium text-zinc-300 mb-2">快捷键提示</p>
          <div className="space-y-1.5 text-[11px] text-zinc-500">
            <p className="flex items-center gap-2"><Server className="size-3 text-primary flex-shrink-0" />从左侧侧边栏选择服务器连接</p>
            <p className="flex items-center gap-2"><kbd className="inline-flex h-4 items-center rounded bg-zinc-800 px-1 font-mono text-[10px] flex-shrink-0">Ctrl+L</kbd>清空终端屏幕</p>
            <p className="flex items-center gap-2"><kbd className="inline-flex h-4 items-center rounded bg-zinc-800 px-1 font-mono text-[10px] flex-shrink-0">↑ / ↓</kbd>浏览命令历史</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===================== 侧边栏 =====================
function ServerSidebar({ servers, activeServerId, onServerSelect, onNewConnection, collapsed }) {
  const [search, setSearch] = useState('')
  const filtered = servers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.host.toLowerCase().includes(search.toLowerCase())
  )

  if (collapsed) {
    return (
      <div className="flex h-full w-14 flex-col items-center border-r border-border bg-card py-3 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="mb-4 size-9 text-primary hover:bg-primary/10 hover:text-primary" onClick={onNewConnection}>
              <Plus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">新建连接</TooltipContent>
        </Tooltip>
        <ScrollArea className="flex-1 w-full">
          <div className="flex flex-col items-center gap-1 px-2">
            {servers.map(server => (
              <Tooltip key={server.id}>
                <TooltipTrigger asChild>
                  <button onClick={() => onServerSelect(server)}
                    className={cn('relative flex size-9 items-center justify-center rounded-md transition-colors',
                      activeServerId === server.id ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}>
                    <Server className="size-4" />
                    <Circle className="absolute right-1 top-1 size-2 fill-current text-emerald-500" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="font-medium text-xs">{server.name}</p>
                  <p className="text-muted-foreground text-xs">{server.host}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/15">
            <Server className="size-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold">服务器</span>
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 text-[10px] font-medium text-secondary-foreground">{servers.length}</span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={onNewConnection}>
              <Plus className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>新建连接</TooltipContent>
        </Tooltip>
      </div>

      {/* Search */}
      <div className="px-3 py-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="搜索服务器..." value={search} onChange={e => setSearch(e.target.value)}
            className="h-8 w-full rounded-md border border-input bg-muted/50 pl-8 text-xs focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" />
        </div>
      </div>

      {/* Server List */}
      <ScrollArea className="flex-1">
        <div className="px-2 pb-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-xs text-muted-foreground gap-2">
              <Server className="size-8 opacity-20" />
              <span>{search ? '未找到匹配的服务器' : '暂无服务器'}</span>
            </div>
          ) : (
            <div className="space-y-0.5 pt-1">
              {filtered.map(server => (
                <div key={server.id} className="group relative">
                  <button onClick={() => onServerSelect(server)}
                    className={cn('flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors',
                      activeServerId === server.id ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground')}>
                    <div className="mt-1 flex-shrink-0">
                      <Circle className="size-2 fill-current text-emerald-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-medium text-foreground">{server.name}</span>
                        {server.auth_type === 'key' ? <Key className="size-3 flex-shrink-0 text-muted-foreground" /> : <Lock className="size-3 flex-shrink-0 text-muted-foreground" />}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span className="font-mono">{server.username}@{server.host}</span>
                        {server.port !== 22 && <span className="font-mono">:{server.port}</span>}
                      </div>
                    </div>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100">
                        <MoreHorizontal className="size-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem className="text-xs"><Pencil className="mr-2 size-3" />编辑</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs"><Copy className="mr-2 size-3" />复制信息</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-xs text-destructive"><Trash2 className="mr-2 size-3" />删除</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border px-4 py-2.5 shrink-0">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{servers.length} 台服务器</span>
          <span className="text-emerald-500">{servers.length} 在线</span>
        </div>
      </div>
    </div>
  )
}

// ===================== 终端视图 =====================
function TerminalView({ server, session, isActive, onStatusChange }) {
  const terminalRef = useRef(null)
  const xtermRef = useRef(null)
  const fitAddonRef = useRef(null)
  const socketRef = useRef(null)

  useEffect(() => {
    if (!server || !terminalRef.current) return

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: { background: '#1e1e1e', foreground: '#ffffff', cursor: '#ffffff', selectionBackground: '#264f78' },
      disableStdin: false,
      scrollback: 5000,
    })
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(terminalRef.current)
    fitAddon.fit()
    term.focus()
    xtermRef.current = term
    fitAddonRef.current = fitAddon

    const handleResize = () => { if (fitAddonRef.current) fitAddonRef.current.fit() }
    window.addEventListener('resize', handleResize)

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const backendHost = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host
    const token = localStorage.getItem('token')
    const ws = new WebSocket(`${protocol}//${backendHost}/api/ws/ssh/${server.id}?token=${token}`)

    ws.onopen = () => {
      onStatusChange(session.id, 'connected')
      term.writeln('\r\n\x1b[32m已连接到 ' + server.name + '\x1b[0m\r\n')
      ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }))
    }
    ws.onmessage = event => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'output' || msg.type === 'connected') term.write(msg.data)
        else if (msg.type === 'error') term.writeln(`\r\n\x1b[31m错误: ${msg.data}\x1b[0m\r\n`)
      } catch { /* ignore */ }
    }
    ws.onclose = () => { onStatusChange(session.id, 'disconnected'); term.writeln('\r\n\x1b[31m连接已关闭\x1b[0m\r\n') }
    ws.onerror = () => { onStatusChange(session.id, 'disconnected') }
    term.onData(data => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'input', data })) })
    term.onResize(size => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'resize', cols: size.cols, rows: size.rows })) })
    socketRef.current = ws

    return () => {
      window.removeEventListener('resize', handleResize)
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close()
      term.dispose()
    }
  }, [server?.id]) // eslint-disable-line

  return (
    <div className={cn('absolute inset-0 bg-[#1e1e1e]', !isActive && 'hidden')}>
      <div ref={terminalRef} className="h-full w-full p-1" />
    </div>
  )
}

// ===================== 主组件 =====================
export default function SSHTerminalPage() {
  const servers = useServerStore(state => state.servers)
  const fetchServers = useServerStore(state => state.fetchServers)
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => { fetchServers() }, []) // eslint-disable-line

  const activeSession = sessions.find(s => s.id === activeSessionId) || null
  const activeServer = activeSession ? servers.find(s => s.id === activeSession.serverId) || null : null

  const connectToServer = useCallback((server) => {
    const existing = sessions.find(s => s.serverId === server.id && s.status === 'connected')
    if (existing) { setActiveSessionId(existing.id); return }
    const newSession = {
      id: `sess-${Date.now()}`,
      serverId: server.id,
      serverName: server.name,
      host: server.host,
      status: 'connecting',
      startedAt: new Date().toISOString(),
    }
    setSessions(prev => [...prev, newSession])
    setActiveSessionId(newSession.id)
  }, [sessions])

  const handleStatusChange = useCallback((sessionId, status) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status } : s))
  }, [])

  const handleSessionClose = useCallback((sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId))
    if (activeSessionId === sessionId) {
      const remaining = sessions.filter(s => s.id !== sessionId)
      setActiveSessionId(remaining.length > 0 ? remaining[remaining.length - 1].id : null)
    }
  }, [activeSessionId, sessions])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev)
    if (!isFullscreen) setSidebarCollapsed(true)
  }, [isFullscreen])

  const handleReconnect = useCallback(() => {
    if (!activeServer) return
    // Close existing session and reconnect
    if (activeSessionId) handleSessionClose(activeSessionId)
    setTimeout(() => connectToServer(activeServer), 100)
  }, [activeServer, activeSessionId, handleSessionClose, connectToServer])

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex h-[calc(100vh-80px)] w-full overflow-hidden rounded-lg border border-border bg-background">
        {/* Sidebar */}
        {!isFullscreen && (
          <ServerSidebar
            servers={servers}
            activeServerId={activeServer?.id}
            onServerSelect={connectToServer}
            onNewConnection={() => window.location.href = '/servers'}
            collapsed={sidebarCollapsed}
          />
        )}

        {/* Main */}
        <div className="flex flex-1 flex-col min-w-0">
          <TerminalHeader
            server={activeServer}
            session={activeSession}
            sidebarCollapsed={sidebarCollapsed || isFullscreen}
            isFullscreen={isFullscreen}
            onToggleSidebar={() => isFullscreen ? setIsFullscreen(false) : setSidebarCollapsed(p => !p)}
            onToggleFullscreen={toggleFullscreen}
            onReconnect={handleReconnect}
          />

          <SessionTabs
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSessionSelect={setActiveSessionId}
            onSessionClose={handleSessionClose}
          />

          <main className="flex-1 min-h-0 relative">
            {sessions.length === 0 ? (
              <EmptyTerminal
                servers={servers}
                onNewConnection={() => window.location.href = '/servers'}
                onServerSelect={connectToServer}
              />
            ) : (
              sessions.map(session => {
                const server = servers.find(s => s.id === session.serverId)
                if (!server) return null
                return (
                  <TerminalView
                    key={session.id}
                    server={server}
                    session={session}
                    isActive={session.id === activeSessionId}
                    onStatusChange={handleStatusChange}
                  />
                )
              })
            )}
          </main>

          <StatusBar server={activeServer} session={activeSession} sessionCount={sessions.length} />
        </div>
      </div>
    </TooltipProvider>
  )
}
