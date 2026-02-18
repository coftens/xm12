"use client"

import {
  PanelLeftClose,
  PanelLeft,
  Maximize2,
  Minimize2,
  Upload,
  Download,
  Settings,
  Info,
  Wifi,
  WifiOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { SSHServer } from "@/lib/ssh-types"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface TerminalHeaderProps {
  server: SSHServer | null
  sidebarCollapsed: boolean
  isFullscreen: boolean
  onToggleSidebar: () => void
  onToggleFullscreen: () => void
}

export function TerminalHeader({
  server,
  sidebarCollapsed,
  isFullscreen,
  onToggleSidebar,
  onToggleFullscreen,
}: TerminalHeaderProps) {
  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-card px-3">
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={onToggleSidebar}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
          </TooltipContent>
        </Tooltip>

        {/* Logo */}
        <div className="flex items-center gap-2 mr-2">
          <div className="flex size-6 items-center justify-center rounded bg-primary/20">
            <span className="text-xs font-bold text-primary font-mono">{">"}_</span>
          </div>
          <span className="text-sm font-semibold text-foreground hidden sm:inline">
            WebTerm
          </span>
        </div>

        {/* Server Info */}
        {server && (
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div
              className={cn(
                "flex items-center gap-1.5",
                server.status === "online"
                  ? "text-success"
                  : "text-muted-foreground"
              )}
            >
              {server.status === "online" ? (
                <Wifi className="size-3.5" />
              ) : (
                <WifiOff className="size-3.5" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground leading-none">
                {server.name}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono leading-tight">
                {server.username}@{server.host}:{server.port}
              </span>
            </div>
            {server.os && (
              <Badge
                variant="outline"
                className="ml-1 h-5 text-[10px] font-normal border-border text-muted-foreground hidden md:inline-flex"
              >
                {server.os}
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
            >
              <Upload className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Upload file</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
            >
              <Download className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download file</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
            >
              <Info className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Connection info</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
            >
              <Settings className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>

        <div className="w-px h-5 bg-border mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={onToggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="size-3.5" />
              ) : (
                <Maximize2 className="size-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  )
}
