"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NavIcon } from "./file-icon"
import type { NavigationItem } from "@/lib/file-manager-types"

interface SidebarProps {
  navigation: NavigationItem[]
  currentPath: string
  onNavigate: (path: string) => void
}

export function FileManagerSidebar({
  navigation,
  currentPath,
  onNavigate,
}: SidebarProps) {
  return (
    <div className="flex h-full flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <div className="size-2 rounded-full bg-primary" />
        <span className="text-xs font-medium text-sidebar-foreground">
          cloud-server-01
        </span>
        <span className="ml-auto rounded-sm bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
          Connected
        </span>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-1">
          {navigation.map((section) => (
            <SidebarSection
              key={section.id}
              item={section}
              currentPath={currentPath}
              onNavigate={onNavigate}
              level={0}
            />
          ))}
        </div>
      </ScrollArea>
      <div className="border-t border-border px-3 py-2">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Disk: 45.2 GB / 100 GB</span>
          <span>45%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[45%] rounded-full bg-primary" />
        </div>
      </div>
    </div>
  )
}

interface SidebarSectionProps {
  item: NavigationItem
  currentPath: string
  onNavigate: (path: string) => void
  level: number
}

function SidebarSection({
  item,
  currentPath,
  onNavigate,
  level,
}: SidebarSectionProps) {
  const [isExpanded, setIsExpanded] = useState(item.isExpanded ?? false)
  const hasChildren = item.children && item.children.length > 0
  const isGroup = level === 0

  if (isGroup) {
    return (
      <div className="mb-0.5">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center gap-1 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-sidebar-foreground"
        >
          {isExpanded ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronRight className="size-3" />
          )}
          <NavIcon icon={item.icon} className="size-3.5 text-muted-foreground" />
          <span>{item.name}</span>
        </button>
        {isExpanded && hasChildren && (
          <div>
            {item.children!.map((child) => (
              <SidebarSection
                key={child.id}
                item={child}
                currentPath={currentPath}
                onNavigate={onNavigate}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  const isActive = currentPath === item.path

  return (
    <div>
      <button
        onClick={() => {
          if (item.path) onNavigate(item.path)
          if (hasChildren) setIsExpanded(!isExpanded)
        }}
        className={cn(
          "group flex w-full items-center gap-2 py-1 pr-2 text-sm transition-colors",
          "hover:bg-sidebar-accent",
          isActive && "bg-selection text-selection-foreground",
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
          )
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <NavIcon
          icon={item.icon}
          className={cn(
            "shrink-0",
            isActive ? "text-selection-foreground" : "text-sidebar-foreground",
          )}
        />
        <span
          className={cn(
            "truncate text-[13px]",
            isActive
              ? "font-medium text-selection-foreground"
              : "text-sidebar-foreground",
          )}
        >
          {item.name}
        </span>
      </button>
      {isExpanded && hasChildren && (
        <div>
          {item.children!.map((child) => (
            <SidebarSection
              key={child.id}
              item={child}
              currentPath={currentPath}
              onNavigate={onNavigate}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
