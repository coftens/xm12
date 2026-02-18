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
            <CardContent className="flex items-center gap-3 p-3">
                <div
                    className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-md",
                        color
                    )}
                >
                    {React.cloneElement(icon, { className: "size-5" })}
                </div>
                <div className="flex-1 space-y-0.5 min-w-0">
                    <p className="text-[10px] font-medium text-muted-foreground truncate">{title}</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold font-mono tracking-tight text-foreground truncate">
                            {value}
                        </span>
                        {unit && (
                            <span className="text-xs text-muted-foreground">{unit}</span>
                        )}
                    </div>
                </div>
                {percentage !== undefined && (
                    <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="relative size-9">
                            <svg className="size-9 -rotate-90" viewBox="0 0 36 36">
                                <circle
                                    cx="18"
                                    cy="18"
                                    r="14"
                                    fill="none"
                                    className="stroke-muted/20"
                                    strokeWidth="3"
                                />
                                <circle
                                    cx="18"
                                    cy="18"
                                    r="14"
                                    fill="none"
                                    className={cn(
                                        "transition-all duration-500 ease-out",
                                        percentage > 90
                                            ? "stroke-destructive"
                                            : percentage > 75
                                                ? "stroke-yellow-500"
                                                : "stroke-primary"
                                    )}
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(percentage / 100) * 87.96} 87.96`}
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-semibold text-foreground">
                                {Math.round(percentage)}%
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
