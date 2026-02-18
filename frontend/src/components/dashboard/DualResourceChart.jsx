import React from 'react'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export function DualResourceChart({
    title,
    data,
    key1,
    key2,
    label1,
    label2,
    colorVar1 = "--chart-1",
    colorVar2 = "--chart-2",
    icon: Icon,
    iconColorClass = "text-primary"
}) {
    const chartConfig = {
        [key1]: {
            label: label1,
            color: `var(${colorVar1})`,
        },
        [key2]: {
            label: label2,
            color: `var(${colorVar2})`,
        }
    }

    return (
        <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {Icon && <div className={`p-1.5 rounded-md bg-muted ${iconColorClass}`}><Icon size={16} /></div>}
                        <CardTitle className="text-sm font-medium text-foreground">
                            {title}
                        </CardTitle>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <div className={`size-2 rounded-full`} style={{ backgroundColor: `hsl(var(${colorVar1}))` }} />
                            <span className="text-xs text-muted-foreground">{label1}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className={`size-2 rounded-full`} style={{ backgroundColor: `hsl(var(${colorVar2}))` }} />
                            <span className="text-xs text-muted-foreground">{label2}</span>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ChartContainer config={chartConfig} className="h-full w-full">
                        <AreaChart
                            data={data}
                            margin={{ top: 5, right: 0, bottom: 0, left: 0 }}
                        >
                            <defs>
                                <linearGradient id={`gradient-${key1}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={`var(${colorVar1})`} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={`var(${colorVar1})`} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id={`gradient-${key2}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={`var(${colorVar2})`} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={`var(${colorVar2})`} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                            <XAxis
                                dataKey="time"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={30}
                                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickCount={5}
                                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Area
                                type="monotone"
                                dataKey={key1}
                                stroke={`var(${colorVar1})`}
                                strokeWidth={2}
                                fill={`url(#gradient-${key1})`}
                                stackId="1"
                                fillOpacity={1}
                            />
                            <Area
                                type="monotone"
                                dataKey={key2}
                                stroke={`var(${colorVar2})`}
                                strokeWidth={2}
                                fill={`url(#gradient-${key2})`}
                                stackId="1"
                                fillOpacity={1}
                            />
                        </AreaChart>
                    </ChartContainer>
                </div>
            </CardContent>
        </Card>
    )
}
