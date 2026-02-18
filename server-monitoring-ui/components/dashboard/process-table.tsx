"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ProcessInfo } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface ProcessTableProps {
  processes: ProcessInfo[]
}

export function ProcessTable({ processes }: ProcessTableProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">
            Top Processes
          </CardTitle>
          <span className="text-xs text-muted-foreground font-mono">
            {processes.length} processes
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="py-2.5 pr-4 text-left text-xs font-medium text-muted-foreground">
                  PID
                </th>
                <th className="py-2.5 pr-4 text-left text-xs font-medium text-muted-foreground">
                  Name
                </th>
                <th className="py-2.5 pr-4 text-right text-xs font-medium text-muted-foreground">
                  CPU %
                </th>
                <th className="py-2.5 pr-4 text-right text-xs font-medium text-muted-foreground">
                  MEM %
                </th>
                <th className="py-2.5 text-right text-xs font-medium text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {processes.map((process) => (
                <tr
                  key={process.pid}
                  className="border-b border-border/20 last:border-0 hover:bg-accent/50 transition-colors"
                >
                  <td className="py-2.5 pr-4 text-sm font-mono text-muted-foreground">
                    {process.pid}
                  </td>
                  <td className="py-2.5 pr-4 text-sm font-mono text-foreground">
                    {process.name}
                  </td>
                  <td className="py-2.5 pr-4 text-right">
                    <span
                      className={cn(
                        "text-sm font-mono",
                        process.cpu > 10
                          ? "text-destructive"
                          : process.cpu > 5
                            ? "text-warning"
                            : "text-foreground"
                      )}
                    >
                      {process.cpu.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-right">
                    <span
                      className={cn(
                        "text-sm font-mono",
                        process.memory > 10
                          ? "text-destructive"
                          : process.memory > 5
                            ? "text-warning"
                            : "text-foreground"
                      )}
                    >
                      {process.memory.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0",
                        process.status === "running"
                          ? "border-success/40 text-success"
                          : process.status === "sleeping"
                            ? "border-warning/40 text-warning"
                            : "border-destructive/40 text-destructive"
                      )}
                    >
                      {process.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
