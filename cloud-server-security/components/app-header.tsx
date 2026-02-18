"use client"

import { Bell, Search, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AppHeaderProps {
  title: string
  description: string
}

export function AppHeader({ title, description }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 h-16 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索安全事件..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-48"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer" aria-label="通知">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] bg-danger text-danger-foreground border-0">
            3
          </Badge>
        </button>

        {/* User */}
        <div className="flex items-center gap-2 pl-4 border-l border-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">管理员</span>
            <span className="text-[10px] text-muted-foreground">admin@cloud.cn</span>
          </div>
        </div>
      </div>
    </header>
  )
}
