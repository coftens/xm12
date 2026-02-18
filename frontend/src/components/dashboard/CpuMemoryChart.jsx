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

const chartConfig = {
    cpu: {
        label: "CPU",
        color: "var(--chart-1)",
    },
    memory: {
        label: "Memory",
        color: "var(--chart-2)",
    },
}

export function CpuMemoryChart({ data }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU & Memory Usage</CardTitle>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="text-xs text-muted-foreground">CPU</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-purple-500" />
                        <span className="text-xs text-muted-foreground">Memory</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-[280px] w-full">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                    >
                        <defs>
                            <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="0%"
                                    stopColor="var(--color-cpu)"
                                    stopOpacity={0.3}
                                />
                                <stop
                                    offset="100%"
                                    stopColor="var(--color-cpu)"
                                    stopOpacity={0.02}
                                />
                            </linearGradient>
                            <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="0%"
                                    stopColor="var(--color-memory)"
                                    stopOpacity={0.3}
                                />
                                <stop
                                    offset="100%"
                                    stopColor="var(--color-memory)"
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
                            domain={[0, 100]}
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
                            dataKey="cpu"
                            stroke="var(--color-cpu)"
                            strokeWidth={2}
                            fill="url(#cpuGradient)"
                            stackId="1"
                        />
                        <Area
                            type="monotone"
                            dataKey="memory"
                            stroke="var(--color-memory)"
                            strokeWidth={2}
                            fill="url(#memoryGradient)"
                            stackId="2"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
