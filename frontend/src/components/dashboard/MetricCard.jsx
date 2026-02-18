import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function MetricCard({
    title,
    value,
    unit,
    icon,
    percentage,
}) {
    // Dynamic Status Color Logic
    let statusColor = "text-blue-500";
    let statusBg = "bg-blue-500/10";
    let strokeColor = "stroke-blue-500";

    if (percentage !== undefined) {
        if (percentage >= 90) {
            statusColor = "text-red-500";
            statusBg = "bg-red-500/10";
            strokeColor = "stroke-red-500";
        } else if (percentage >= 80) {
            statusColor = "text-yellow-500";
            statusBg = "bg-yellow-500/10";
            strokeColor = "stroke-yellow-500";
        }
    }

    return (
        <Card className="border-border/50 relative overflow-hidden bg-card/50">
            <CardContent className="flex items-center justify-between p-4 gap-3">
                {/* Left Side: Icon & Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                        className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-md transition-colors duration-300",
                            statusBg
                        )}
                    >
                        {React.cloneElement(icon, { className: cn("size-5 transition-colors duration-300", statusColor) })}
                    </div>
                    <div className="space-y-0.5 min-w-0 overflow-hidden">
                        <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold font-mono tracking-tight text-foreground whitespace-nowrap">
                                {value}
                            </span>
                            {unit && (
                                <span className="text-xs text-muted-foreground">{unit}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Progress Ring */}
                {percentage !== undefined && (
                    <div className="flex flex-col items-center justify-center shrink-0">
                        <div className="relative size-10">
                            <svg className="size-10 -rotate-90" viewBox="0 0 40 40">
                                <circle
                                    cx="20"
                                    cy="20"
                                    r="16"
                                    fill="none"
                                    className="stroke-muted/20"
                                    strokeWidth="3"
                                />
                                <circle
                                    cx="20"
                                    cy="20"
                                    r="16"
                                    fill="none"
                                    className={cn(
                                        "transition-all duration-500 ease-out",
                                        strokeColor
                                    )}
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(percentage / 100) * 100.5} 100.5`}
                                />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-foreground">
                                {Math.round(percentage)}%
                            </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
