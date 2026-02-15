import React, { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { useServerStore } from '@/store/useServerStore'
import { Button } from '@/components/ui/button'
import { AlertCircle, Terminal as TerminalIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SSHConnection() {
  const terminalRef = useRef(null)
  const xtermRef = useRef(null)
  const fitAddonRef = useRef(null)
  const socketRef = useRef(null)
  const currentServer = useServerStore(state => state.currentServer)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!currentServer) return

    const initTerminal = () => {
      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        theme: {
          background: '#1e1e1e',
          foreground: '#ffffff',
        },
        disableStdin: false,
      })

      const fitAddon = new FitAddon()
      term.loadAddon(fitAddon)

      if (terminalRef.current) {
        term.open(terminalRef.current)
        fitAddon.fit()
        term.focus()
      }

      xtermRef.current = term
      fitAddonRef.current = fitAddon

      // Handle Resize
      const handleResize = () => fitAddon.fit()
      window.addEventListener('resize', handleResize)

      // Connect WebSocket
      connectWebSocket(term)

      return () => {
        window.removeEventListener('resize', handleResize)
        if (socketRef.current) socketRef.current.close()
        term.dispose()
      }
    }

    const cleanup = initTerminal()
    return cleanup
  }, [currentServer])

  const connectWebSocket = (term) => {
    setError('')
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    // Determine the backend host (similar to api.js logic)
    let backendHost;
    if (window.location.hostname === 'localhost') {
      backendHost = 'localhost:8000';
    } else {
      // Production: use same host:port as the frontend (Nginx will proxy /ws/ to backend)
      backendHost = window.location.host
    }

    const wsUrl = `${protocol}//${backendHost}/api/ws/ssh/${currentServer.id}`

    // Auth token in URL or protocol is tricky with standard WebSocket in browser if headers not supported
    // Usually we pass token as a query param or strict cookie.
    // Let's assume the backend accepts ?token=...
    const token = localStorage.getItem('token')
    const ws = new WebSocket(`${wsUrl}?token=${token}`)

    ws.onopen = () => {
      setIsConnected(true)
      term.writeln('\r\n\x1b[32mConnected to ' + currentServer.name + '\x1b[0m\r\n')

      // Send initial resize
      const dims = { cols: term.cols, rows: term.rows }
      ws.send(JSON.stringify({ type: 'resize', ...dims }))
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'output' || msg.type === 'connected') {
          term.write(msg.data)
        } else if (msg.type === 'error') {
          term.writeln(`\r\n\x1b[31mError: ${msg.data}\x1b[0m\r\n`)
        }
      } catch (e) {
        // If not JSON, maybe just write it? Or ignore?
        // term.write(event.data)
        console.error("Failed to parse websocket message", event.data)
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      term.writeln('\r\n\x1b[31mConnection closed\x1b[0m\r\n')
    }

    ws.onerror = (e) => {
      setError('Connection Error')
      setIsConnected(false)
    }

    term.onData(data => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }))
      }
    })

    term.onResize(size => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: size.cols, rows: size.rows }))
      }
    })

    socketRef.current = ws
  }

  const handleReconnect = () => {
    if (xtermRef.current) {
      xtermRef.current.clear()
      connectWebSocket(xtermRef.current)
    }
  }

  if (!currentServer) {
    return (
      <div className="flex h-[calc(100vh-120px)] flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <TerminalIcon className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">未选择服务器</h2>
        <p className="text-muted-foreground">请在左侧菜单或服务器列表中选择一台服务器以连接 SSH。</p>
        <Button variant="outline" asChild>
          <a href="/servers">去选择服务器</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TerminalIcon className="w-5 h-5" /> {currentServer.name} ({currentServer.host})
          </h2>
          <span className={cn("text-xs px-2 py-0.5 rounded-full", isConnected ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
            {isConnected ? '已连接' : '已断开'}
          </span>
        </div>
        {!isConnected && (
          <Button size="sm" onClick={handleReconnect} variant="outline">
            重连
          </Button>
        )}
      </div>

      <div className="flex-1 rounded-lg border bg-black p-1 overflow-hidden relative shadow-inner">
        <div ref={terminalRef} className="h-full w-full" />
      </div>
    </div>
  )
}
