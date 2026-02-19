"use client"

import { X, Circle, Terminal } from "lucide-react"
import type { SSHSession } from "@/lib/ssh-types"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SessionTabsProps {
  sessions: SSHSession[]
  activeSessionId: string | null
  onSessionSelect: (sessionId: string) => void
  onSessionClose: (sessionId: string) => void
}

export function SessionTabs({
  sessions,
  activeSessionId,
  onSessionSelect,
  onSessionClose,
}: SessionTabsProps) {
  if (sessions.length === 0) return null

  return (
    <div className="flex items-center gap-0 bg-card border-b border-border overflow-x-auto">
      {sessions.map((session) => (
        <div
          key={session.id}
          className={cn(
            "group flex items-center gap-2 border-r border-border px-3 py-2 text-xs cursor-pointer transition-colors min-w-0 max-w-[200px]",
            activeSessionId === session.id
              ? "bg-terminal text-foreground border-b-2 border-b-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
          onClick={() => onSessionSelect(session.id)}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Circle
              className={cn(
                "size-2 flex-shrink-0 fill-current",
                session.status === "connected"
                  ? "text-success"
                  : session.status === "connecting"
                  ? "text-warning"
                  : "text-muted-foreground"
              )}
            />
            <Terminal className="size-3 flex-shrink-0" />
            <span className="truncate font-medium">{session.serverName}</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSessionClose(session.id)
                }}
                className="flex size-4 flex-shrink-0 items-center justify-center rounded-sm opacity-0 transition-opacity hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Close session</TooltipContent>
          </Tooltip>
        </div>
      ))}
    </div>
  )
}
