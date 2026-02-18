"use client"

import { Server, Circle, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react"

export function DashboardHeader() {
  const [timeRange, setTimeRange] = useState("30m")

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15">
          <Server className="size-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Server Monitor
            </h1>
            <Badge
              variant="outline"
              className="border-success/40 text-success gap-1 text-[10px] px-1.5 py-0"
            >
              <Circle className="size-1.5 fill-current" />
              Online
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            prod-server-01 &middot; Last updated just now
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[130px] h-8 text-xs bg-card border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5m">Last 5 min</SelectItem>
            <SelectItem value="15m">Last 15 min</SelectItem>
            <SelectItem value="30m">Last 30 min</SelectItem>
            <SelectItem value="1h">Last 1 hour</SelectItem>
            <SelectItem value="6h">Last 6 hours</SelectItem>
            <SelectItem value="24h">Last 24 hours</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs border-border/50 bg-card text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
      </div>
    </header>
  )
}
