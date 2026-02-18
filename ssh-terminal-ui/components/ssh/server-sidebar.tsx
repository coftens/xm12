"use client"

import { useState } from "react"
import {
  Server,
  Plus,
  Search,
  ChevronRight,
  Circle,
  Key,
  Lock,
  Clock,
  MoreHorizontal,
  FolderOpen,
  Pencil,
  Trash2,
  Copy,
} from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { SSHServer, ServerGroup } from "@/lib/ssh-types"
import { cn } from "@/lib/utils"

interface ServerSidebarProps {
  servers: SSHServer[]
  activeServerId?: string
  onServerSelect: (server: SSHServer) => void
  onNewConnection: () => void
  collapsed: boolean
}

function groupServers(servers: SSHServer[]): ServerGroup[] {
  const groups: Record<string, SSHServer[]> = {}
  for (const server of servers) {
    if (!groups[server.group]) {
      groups[server.group] = []
    }
    groups[server.group].push(server)
  }
  return Object.entries(groups).map(([name, srvs]) => ({
    name,
    servers: srvs,
  }))
}

export function ServerSidebar({
  servers,
  activeServerId,
  onServerSelect,
  onNewConnection,
  collapsed,
}: ServerSidebarProps) {
  const [search, setSearch] = useState("")
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["Production", "Staging", "Development", "Infrastructure"])
  )

  const filteredServers = servers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.host.toLowerCase().includes(search.toLowerCase()) ||
      s.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  )

  const groups = groupServers(filteredServers)

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  const statusColor = (status: SSHServer["status"]) => {
    switch (status) {
      case "online":
        return "text-success"
      case "offline":
        return "text-muted-foreground"
      case "connecting":
        return "text-warning"
    }
  }

  if (collapsed) {
    return (
      <div className="flex h-full w-14 flex-col items-center border-r border-border bg-sidebar py-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="mb-4 size-9 text-primary hover:bg-primary/10 hover:text-primary"
              onClick={onNewConnection}
            >
              <Plus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">New Connection</TooltipContent>
        </Tooltip>
        <ScrollArea className="flex-1 w-full">
          <div className="flex flex-col items-center gap-1 px-2">
            {servers.map((server) => (
              <Tooltip key={server.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onServerSelect(server)}
                    className={cn(
                      "relative flex size-9 items-center justify-center rounded-md transition-colors",
                      activeServerId === server.id
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Server className="size-4" />
                    <Circle
                      className={cn(
                        "absolute right-1 top-1 size-2 fill-current",
                        statusColor(server.status)
                      )}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <div className="text-xs">
                    <p className="font-medium">{server.name}</p>
                    <p className="text-muted-foreground">{server.host}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/15">
            <Server className="size-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-sidebar-foreground">
            Servers
          </span>
          <Badge
            variant="secondary"
            className="h-5 px-1.5 text-[10px] font-medium bg-secondary text-secondary-foreground"
          >
            {servers.length}
          </Badge>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={onNewConnection}
            >
              <Plus className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Connection</TooltipContent>
        </Tooltip>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search servers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 bg-input/50 pl-8 text-xs border-border placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Server List */}
      <ScrollArea className="flex-1">
        <div className="px-2 pb-2">
          {groups.map((group) => (
            <div key={group.name} className="mb-1">
              <button
                onClick={() => toggleGroup(group.name)}
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight
                  className={cn(
                    "size-3 transition-transform duration-200",
                    expandedGroups.has(group.name) && "rotate-90"
                  )}
                />
                <FolderOpen className="size-3" />
                <span>{group.name}</span>
                <span className="ml-auto text-[10px] tabular-nums">
                  {group.servers.length}
                </span>
              </button>

              {expandedGroups.has(group.name) && (
                <div className="ml-2 space-y-0.5">
                  {group.servers.map((server) => (
                    <div key={server.id} className="group relative">
                      <button
                        onClick={() => onServerSelect(server)}
                        className={cn(
                          "flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors",
                          activeServerId === server.id
                            ? "bg-primary/10 text-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent"
                        )}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          <Circle
                            className={cn(
                              "size-2 fill-current",
                              statusColor(server.status)
                            )}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-xs font-medium">
                              {server.name}
                            </span>
                            {server.authType === "key" ? (
                              <Key className="size-3 flex-shrink-0 text-muted-foreground" />
                            ) : (
                              <Lock className="size-3 flex-shrink-0 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <span className="font-mono">{server.host}</span>
                            {server.port !== 22 && (
                              <span className="font-mono">:{server.port}</span>
                            )}
                          </div>
                          {server.lastConnected && (
                            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground/70">
                              <Clock className="size-2.5" />
                              <span>{server.lastConnected}</span>
                            </div>
                          )}
                        </div>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100">
                            <MoreHorizontal className="size-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem className="text-xs">
                            <Pencil className="mr-2 size-3" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs">
                            <Copy className="mr-2 size-3" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-xs text-destructive-foreground">
                            <Trash2 className="mr-2 size-3" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border px-4 py-2.5">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>
            {servers.filter((s) => s.status === "online").length} online
          </span>
          <span>{servers.length} total</span>
        </div>
      </div>
    </div>
  )
}
