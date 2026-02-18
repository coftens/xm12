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
import { cn } from '@/lib/utils'

// Generic chart config - will be overridden by props but good to have base
const baseChartConfig = {
    value: {
        label: "Usage",
        color: "hsl(var(--chart-1))",
    },
}

export function ResourceChart({
    title,
    data,
    dataKey = "value",
    colorVar = "--chart-1",
    icon: Icon,
    iconColorClass = "text-blue-500",
    yAxisMax = 100
}) {

    // Dynamic config based on props
    const chartConfig = {
        [dataKey]: {
            label: title,
            color: `hsl(var(${colorVar}))`,
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {Icon && <Icon className={cn("w-4 h-4", iconColorClass)} />}
                    {title}
                </CardTitle>
                <span className="text-xs text-muted-foreground">Max: {yAxisMax}%</span>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                    >
                        <defs>
                            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="0%"
                                    stopColor={`var(${colorVar})`}
                                    stopOpacity={0.3}
                                />
                                <stop
                                    offset="100%"
                                    stopColor={`var(${colorVar})`}
                                    stopOpacity={0.02}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-muted"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="time"
                            className="text-muted-foreground"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            className="text-muted-foreground"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, yAxisMax]}
                            tickFormatter={(val) => `${val}%`}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    indicator="dot"
                                    labelFormatter={(label) => `Time: ${label}`}
                                />
                            }
                        />
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={`var(${colorVar})`}
                            strokeWidth={2}
                            fill={`url(#gradient-${dataKey})`}
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
