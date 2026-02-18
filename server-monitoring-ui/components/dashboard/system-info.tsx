import {
  Server,
  Cpu,
  HardDrive,
  Clock,
  Thermometer,
  FileText,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { currentMetrics as MetricsType } from "@/lib/mock-data"

interface SystemInfoProps {
  metrics: typeof MetricsType
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-mono text-foreground">{value}</span>
    </div>
  )
}

export function SystemInfo({ metrics }: SystemInfoProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          System Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        <InfoRow
          label="Hostname"
          value={metrics.hostname}
          icon={<Server className="size-3.5" />}
        />
        <InfoRow
          label="OS"
          value={metrics.os}
          icon={<Server className="size-3.5" />}
        />
        <InfoRow
          label="Kernel"
          value={metrics.kernel}
        />
        <InfoRow
          label="Architecture"
          value={metrics.arch}
        />
        <InfoRow
          label="CPU Model"
          value={metrics.cpuModel}
          icon={<Cpu className="size-3.5" />}
        />
        <InfoRow
          label="CPU Cores"
          value={`${metrics.cpuCores} cores`}
        />
        <InfoRow
          label="Uptime"
          value={metrics.uptime}
          icon={<Clock className="size-3.5" />}
        />
        <InfoRow
          label="Temperature"
          value={`${metrics.temperature} C`}
          icon={<Thermometer className="size-3.5" />}
        />
        <InfoRow
          label="Load Average"
          value={metrics.loadAvg.join(" / ")}
        />
        <InfoRow
          label="Open Files"
          value={metrics.openFiles.toLocaleString()}
          icon={<FileText className="size-3.5" />}
        />
        <InfoRow
          label="Disk"
          value={`${metrics.usedDisk} / ${metrics.totalDisk}`}
          icon={<HardDrive className="size-3.5" />}
        />
        <InfoRow
          label="Swap"
          value={`${metrics.swapUsed} / ${metrics.swapTotal}`}
        />
      </CardContent>
    </Card>
  )
}
