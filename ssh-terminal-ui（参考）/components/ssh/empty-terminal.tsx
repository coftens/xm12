"use client"

import { Terminal, Plus, Server, Zap, Shield, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyTerminalProps {
  onNewConnection: () => void
}

export function EmptyTerminal({ onNewConnection }: EmptyTerminalProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-terminal px-6">
      <div className="flex flex-col items-center text-center max-w-md">
        {/* Logo */}
        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
          <Terminal className="size-8 text-primary" />
        </div>

        <h2 className="mb-2 text-xl font-semibold text-foreground text-balance">
          Welcome to WebTerm
        </h2>
        <p className="mb-8 text-sm text-muted-foreground leading-relaxed text-pretty">
          A modern SSH terminal client for your browser. Connect to your servers
          securely and manage them from anywhere.
        </p>

        <Button
          onClick={onNewConnection}
          className="mb-10 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-5"
        >
          <Plus className="size-4" />
          New Connection
        </Button>

        {/* Features */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-accent">
              <Zap className="size-4 text-primary" />
            </div>
            <span className="text-[11px] text-muted-foreground">
              Multi-session
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-accent">
              <Shield className="size-4 text-primary" />
            </div>
            <span className="text-[11px] text-muted-foreground">
              Encrypted
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-accent">
              <Clock className="size-4 text-primary" />
            </div>
            <span className="text-[11px] text-muted-foreground">
              History
            </span>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-10 rounded-lg border border-border bg-card/50 p-4 w-full">
          <p className="text-xs font-medium text-foreground mb-2">Quick Tips</p>
          <div className="space-y-1.5 text-[11px] text-muted-foreground">
            <p className="flex items-center gap-2">
              <Server className="size-3 text-primary flex-shrink-0" />
              Select a server from the sidebar to connect
            </p>
            <p className="flex items-center gap-2">
              <kbd className="inline-flex h-4 items-center rounded bg-accent px-1 font-mono text-[10px] flex-shrink-0">
                Ctrl+L
              </kbd>
              Clear terminal screen
            </p>
            <p className="flex items-center gap-2">
              <kbd className="inline-flex h-4 items-center rounded bg-accent px-1 font-mono text-[10px] flex-shrink-0">
                {"↑ / ↓"}
              </kbd>
              Navigate command history
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
