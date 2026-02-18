import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function MetricCard({
    title,
    value,
    unit,
    icon,
    color,
    percentage,
}) {
    return (
        <Card className="border-border/50 relative overflow-hidden bg-card/50">
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
                                    className="stroke-muted/20"
                                    strokeWidth="4"
                                />
                                <circle
                                    cx="24"
                                    cy="24"
                                    r="18"
                                    fill="none"
                                    className={cn(
                                        "transition-all duration-500 ease-out",
                                        percentage > 90
                                            ? "stroke-destructive"
                                            : percentage > 75
                                                ? "stroke-yellow-500"
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
