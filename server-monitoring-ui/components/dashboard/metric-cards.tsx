"use client"

import { Cpu, MemoryStick, HardDrive, Activity } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface MetricCardProps {
  title: string
  value: string | number
  unit?: string
  icon: ReactNode
  trend?: "up" | "down" | "stable"
  color: string
  percentage?: number
}

export function MetricCard({
  title,
  value,
  unit,
  icon,
  color,
  percentage,
}: MetricCardProps) {
  return (
    <Card className="border-border/50 relative overflow-hidden">
      <CardContent className="flex items-center gap-4 py-4">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-lg",
            color
          )}
        >
          {icon}
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {value}
            </span>
            {unit && (
              <span className="text-sm text-muted-foreground">{unit}</span>
            )}
          </div>
        </div>
        {percentage !== undefined && (
          <div className="flex flex-col items-end gap-1">
            <div className="relative size-12">
              <svg className="size-12 -rotate-90" viewBox="0 0 48 48">
                <circle
                  cx="24"
                  cy="24"
                  r="18"
                  fill="none"
                  className="stroke-muted"
                  strokeWidth="4"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="18"
                  fill="none"
                  className={cn(
                    percentage > 80
                      ? "stroke-destructive"
                      : percentage > 60
                        ? "stroke-warning"
                        : "stroke-primary"
                  )}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${(percentage / 100) * 113.1} 113.1`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-semibold text-foreground">
                {Math.round(percentage)}%
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function MetricCards({
  cpu,
  memory,
  disk,
  processes,
}: {
  cpu: number
  memory: number
  disk: number
  processes: number
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="CPU"
        value={cpu.toFixed(1)}
        unit="%"
        icon={<Cpu className="size-5 text-primary" />}
        color="bg-primary/15"
        percentage={cpu}
      />
      <MetricCard
        title="Memory"
        value={memory.toFixed(1)}
        unit="%"
        icon={<MemoryStick className="size-5 text-success" />}
        color="bg-success/15"
        percentage={memory}
      />
      <MetricCard
        title="Disk"
        value={disk.toFixed(1)}
        unit="%"
        icon={<HardDrive className="size-5 text-warning" />}
        color="bg-warning/15"
        percentage={disk}
      />
      <MetricCard
        title="Processes"
        value={processes}
        icon={<Activity className="size-5 text-chart-4" />}
        color="bg-chart-4/15"
      />
    </div>
  )
}
