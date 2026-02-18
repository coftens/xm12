"use client"

import { cn } from "@/lib/utils"
import {
  Shield,
  LayoutDashboard,
  Flame,
  ScrollText,
  ScanSearch,
  Users,
  KeyRound,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface AppSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  collapsed: boolean
  onToggle: () => void
}

const navItems = [
  { id: "overview", label: "安全概览", icon: LayoutDashboard },
  { id: "firewall", label: "防火墙规则", icon: Flame },
  { id: "audit", label: "审计日志", icon: ScrollText },
  { id: "vulnerability", label: "漏洞扫描", icon: ScanSearch },
  { id: "access", label: "访问控制", icon: Users },
  { id: "keys", label: "密钥管理", icon: KeyRound },
  { id: "settings", label: "安全设置", icon: Settings },
]

export function AppSidebar({ activeTab, onTabChange, collapsed, onToggle }: AppSidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 relative shrink-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">CloudShield</span>
            <span className="text-[10px] text-muted-foreground leading-none">安全管理中心</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", isActive && "text-primary")} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 flex items-center justify-center w-6 h-6 rounded-full bg-surface-elevated border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Bottom info */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-muted-foreground">系统运行正常</span>
          </div>
        </div>
      )}
    </aside>
  )
}
