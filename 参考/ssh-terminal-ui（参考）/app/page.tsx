"use client"

import { useState, useCallback } from "react"
import { ServerSidebar } from "@/components/ssh/server-sidebar"
import { TerminalView } from "@/components/ssh/terminal-view"
import { SessionTabs } from "@/components/ssh/session-tabs"
import { ConnectionDialog } from "@/components/ssh/connection-dialog"
import { TerminalHeader } from "@/components/ssh/terminal-header"
import { EmptyTerminal } from "@/components/ssh/empty-terminal"
import { StatusBar } from "@/components/ssh/status-bar"
import { mockServers } from "@/lib/ssh-mock-data"
import type { SSHServer, SSHSession } from "@/lib/ssh-types"
import { cn } from "@/lib/utils"

export default function SSHTerminalPage() {
  const [servers, setServers] = useState<SSHServer[]>(mockServers)
  const [sessions, setSessions] = useState<SSHSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null
  const activeServer =
    activeSession
      ? servers.find((s) => s.id === activeSession.serverId) || null
      : null

  const connectToServer = useCallback(
    (server: SSHServer) => {
      // Check if already connected to this server
      const existingSession = sessions.find(
        (s) => s.serverId === server.id && s.status === "connected"
      )
      if (existingSession) {
        setActiveSessionId(existingSession.id)
        return
      }

      const newSession: SSHSession = {
        id: `sess-${Date.now()}`,
        serverId: server.id,
        serverName: server.name,
        host: server.host,
        status: "connected",
        startedAt: new Date().toISOString(),
      }
      setSessions((prev) => [...prev, newSession])
      setActiveSessionId(newSession.id)
    },
    [sessions]
  )

  const handleServerSelect = useCallback(
    (server: SSHServer) => {
      connectToServer(server)
    },
    [connectToServer]
  )

  const handleNewConnection = useCallback(
    (server: SSHServer) => {
      // Add server to list if not exists
      if (!servers.find((s) => s.id === server.id)) {
        setServers((prev) => [...prev, server])
      }
      connectToServer(server)
      setDialogOpen(false)
    },
    [servers, connectToServer]
  )

  const handleSessionClose = useCallback(
    (sessionId: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      if (activeSessionId === sessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId)
        setActiveSessionId(remaining.length > 0 ? remaining[remaining.length - 1].id : null)
      }
    },
    [activeSessionId, sessions]
  )

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev)
    if (!isFullscreen) {
      setSidebarCollapsed(true)
    }
  }, [isFullscreen])

  return (
    <div className={cn("flex h-screen w-screen overflow-hidden bg-background")}>
      {/* Sidebar */}
      {!isFullscreen && (
        <ServerSidebar
          servers={servers}
          activeServerId={activeServer?.id}
          onServerSelect={handleServerSelect}
          onNewConnection={() => setDialogOpen(true)}
          collapsed={sidebarCollapsed}
        />
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <TerminalHeader
          server={activeServer}
          sidebarCollapsed={sidebarCollapsed || isFullscreen}
          isFullscreen={isFullscreen}
          onToggleSidebar={() =>
            isFullscreen
              ? setIsFullscreen(false)
              : setSidebarCollapsed((prev) => !prev)
          }
          onToggleFullscreen={toggleFullscreen}
        />

        {/* Session Tabs */}
        <SessionTabs
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSessionSelect={setActiveSessionId}
          onSessionClose={handleSessionClose}
        />

        {/* Terminal Area */}
        <main className="flex-1 min-h-0 relative">
          {sessions.length === 0 ? (
            <EmptyTerminal onNewConnection={() => setDialogOpen(true)} />
          ) : (
            sessions.map((session) => {
              const server = servers.find((s) => s.id === session.serverId)
              if (!server) return null
              return (
                <TerminalView
                  key={session.id}
                  server={server}
                  isActive={session.id === activeSessionId}
                />
              )
            })
          )}
        </main>

        {/* Status Bar */}
        <StatusBar
          server={activeServer}
          session={activeSession}
          sessionCount={sessions.length}
        />
      </div>

      {/* Connection Dialog */}
      <ConnectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConnect={handleNewConnection}
      />
    </div>
  )
}
