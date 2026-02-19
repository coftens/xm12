import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { MetricCards } from "@/components/dashboard/metric-cards"
import { CpuMemoryChart } from "@/components/dashboard/cpu-memory-chart"
import { DiskChart } from "@/components/dashboard/disk-chart"
import { NetworkChart } from "@/components/dashboard/network-chart"
import { SystemInfo } from "@/components/dashboard/system-info"
import { ProcessTable } from "@/components/dashboard/process-table"
import { ResourceSummary } from "@/components/dashboard/resource-summary"
import {
  cpuMemoryData,
  diskData,
  networkData,
  currentMetrics,
  topProcesses,
} from "@/lib/mock-data"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <DashboardHeader />

          {/* Metric Cards */}
          <MetricCards
            cpu={currentMetrics.cpu}
            memory={currentMetrics.memory}
            disk={currentMetrics.disk}
            processes={currentMetrics.processes}
          />

          {/* Main Charts Section */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* CPU & Memory Chart - Takes 2/3 */}
            <div className="xl:col-span-2">
              <CpuMemoryChart data={cpuMemoryData} />
            </div>
            {/* Resource Summary - Takes 1/3 */}
            <div>
              <ResourceSummary metrics={currentMetrics} />
            </div>
          </div>

          {/* Secondary Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DiskChart data={diskData} />
            <NetworkChart data={networkData} />
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ProcessTable processes={topProcesses} />
            <SystemInfo metrics={currentMetrics} />
          </div>
        </div>
      </main>
    </div>
  )
}
