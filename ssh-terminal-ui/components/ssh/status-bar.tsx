"use client"

import { useState, useEffect } from "react"
import { Wifi, Clock, Terminal, Cpu, HardDrive } from "lucide-react"
import type { SSHServer, SSHSession } from "@/lib/ssh-types"
import { cn } from "@/lib/utils"

interface StatusBarProps {
  server: SSHServer | null
  session: SSHSession | null
  sessionCount: number
}

export function StatusBar({ server, session, sessionCount }: StatusBarProps) {
  return (
    <footer className="flex h-6 items-center justify-between border-t border-border bg-card px-3 text-[10px] text-muted-foreground">
      <div className="flex items-center gap-3">
        {server && session ? (
          <>
            <div className="flex items-center gap-1">
              <Wifi
                className={cn(
                  "size-2.5",
                  session.status === "connected"
                    ? "text-success"
                    : "text-muted-foreground"
                )}
              />
              <span>
                {session.status === "connected" ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-1 font-mono">
              <span>SSH-2.0</span>
            </div>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-1">
              <Terminal className="size-2.5" />
              <span>bash</span>
            </div>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-1">
              <Cpu className="size-2.5" />
              <span>UTF-8</span>
            </div>
          </>
        ) : (
          <span>No active connection</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {server && (
          <>
            <div className="flex items-center gap-1">
              <HardDrive className="size-2.5" />
              <span className="font-mono">
                {server.host}:{server.port}
              </span>
            </div>
            <div className="w-px h-3 bg-border" />
          </>
        )}
        <div className="flex items-center gap-1">
          <Clock className="size-2.5" />
          <SessionTimer active={session?.status === "connected"} />
        </div>
        <div className="w-px h-3 bg-border" />
        <span>
          {sessionCount} session{sessionCount !== 1 ? "s" : ""}
        </span>
      </div>
    </footer>
  )
}

function SessionTimer({ active }: { active: boolean }) {
  if (!active) return <span>00:00:00</span>

  return <TimerDisplay />
}

function TimerDisplay() {
  const [time, setTime] = useState("00:00:00")

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000)
      const h = String(Math.floor(elapsed / 3600)).padStart(2, "0")
      const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0")
      const s = String(elapsed % 60).padStart(2, "0")
      setTime(`${h}:${m}:${s}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return <span className="font-mono tabular-nums">{time}</span>
}
