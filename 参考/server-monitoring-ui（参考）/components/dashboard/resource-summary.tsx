import { MemoryStick, HardDrive, ArrowDown, ArrowUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ResourceBarProps {
  label: string
  used: string
  total: string
  percentage: number
  color: string
}

function ResourceBar({ label, used, total, percentage, color }: ResourceBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-mono text-foreground">
          {used} <span className="text-muted-foreground">/</span> {total}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

interface ResourceMetric {
  label: string
  value: string
  icon: React.ReactNode
  change?: "up" | "down"
}

function QuickStat({ label, value, icon, change }: ResourceMetric) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
      <div className="flex size-8 items-center justify-center rounded-md bg-accent">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-mono text-foreground">{value}</p>
      </div>
      {change && (
        <div className={cn(
          "flex items-center gap-0.5 text-xs font-mono",
          change === "up" ? "text-destructive" : "text-success"
        )}>
          {change === "up" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
        </div>
      )}
    </div>
  )
}

export function ResourceSummary({
  metrics,
}: {
  metrics: {
    usedMemory: string
    totalMemory: string
    memory: number
    usedDisk: string
    totalDisk: string
    disk: number
    swapUsed: string
    swapTotal: string
    networkIn: string
    networkOut: string
  }
}) {
  const swapPercentage = (parseFloat(metrics.swapUsed) / parseFloat(metrics.swapTotal)) * 100

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          Resource Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <ResourceBar
          label="Memory"
          used={metrics.usedMemory}
          total={metrics.totalMemory}
          percentage={metrics.memory}
          color="bg-chart-2"
        />
        <ResourceBar
          label="Disk"
          used={metrics.usedDisk}
          total={metrics.totalDisk}
          percentage={metrics.disk}
          color="bg-warning"
        />
        <ResourceBar
          label="Swap"
          used={metrics.swapUsed}
          total={metrics.swapTotal}
          percentage={swapPercentage}
          color="bg-chart-5"
        />

        <div className="pt-2">
          <QuickStat
            label="Network In"
            value={metrics.networkIn}
            icon={<ArrowDown className="size-3.5 text-chart-1" />}
            change="up"
          />
          <QuickStat
            label="Network Out"
            value={metrics.networkOut}
            icon={<ArrowUp className="size-3.5 text-chart-5" />}
            change="down"
          />
        </div>
      </CardContent>
    </Card>
  )
}
