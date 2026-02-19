// Mock data generator for server monitoring dashboard
// Replace these with actual API calls to your backend

function generateTimeLabels(count: number, intervalMinutes: number = 5) {
  const now = new Date()
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(now.getTime() - (count - 1 - i) * intervalMinutes * 60 * 1000)
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
  })
}

function generateMetric(base: number, variance: number, count: number) {
  return Array.from({ length: count }, () => {
    const value = base + (Math.random() - 0.5) * variance * 2
    return Math.max(0, Math.min(100, Math.round(value * 10) / 10))
  })
}

const DATA_POINTS = 30
const TIME_LABELS = generateTimeLabels(DATA_POINTS)

const cpuValues = generateMetric(45, 18, DATA_POINTS)
const memoryValues = generateMetric(62, 12, DATA_POINTS)
const diskReadValues = generateMetric(35, 20, DATA_POINTS)
const diskWriteValues = generateMetric(20, 15, DATA_POINTS)
const networkInValues = generateMetric(40, 25, DATA_POINTS)
const networkOutValues = generateMetric(25, 18, DATA_POINTS)

export const cpuMemoryData = TIME_LABELS.map((time, i) => ({
  time,
  cpu: cpuValues[i],
  memory: memoryValues[i],
}))

export const diskData = TIME_LABELS.map((time, i) => ({
  time,
  read: diskReadValues[i],
  write: diskWriteValues[i],
}))

export const networkData = TIME_LABELS.map((time, i) => ({
  time,
  inbound: networkInValues[i],
  outbound: networkOutValues[i],
}))

export const currentMetrics = {
  cpu: cpuValues[cpuValues.length - 1],
  memory: memoryValues[memoryValues.length - 1],
  disk: 73.2,
  uptime: "45 days 12:34:56",
  hostname: "prod-server-01",
  os: "Ubuntu 22.04 LTS",
  kernel: "5.15.0-91-generic",
  arch: "x86_64",
  cpuModel: "AMD EPYC 7763 64-Core",
  cpuCores: 8,
  totalMemory: "32 GB",
  usedMemory: "19.8 GB",
  totalDisk: "500 GB",
  usedDisk: "366 GB",
  loadAvg: [2.14, 1.87, 1.62] as [number, number, number],
  networkIn: "1.24 GB/s",
  networkOut: "856 MB/s",
  processes: 247,
  openFiles: 8432,
  swapUsed: "1.2 GB",
  swapTotal: "8 GB",
  temperature: 52,
}

export interface ProcessInfo {
  pid: number
  name: string
  cpu: number
  memory: number
  status: "running" | "sleeping" | "stopped"
}

export const topProcesses: ProcessInfo[] = [
  { pid: 1024, name: "nginx", cpu: 12.3, memory: 4.2, status: "running" },
  { pid: 2048, name: "node", cpu: 8.7, memory: 12.5, status: "running" },
  { pid: 3072, name: "postgres", cpu: 6.1, memory: 8.8, status: "running" },
  { pid: 4096, name: "redis-server", cpu: 3.2, memory: 2.1, status: "running" },
  { pid: 5120, name: "docker", cpu: 2.8, memory: 5.6, status: "running" },
  { pid: 6144, name: "cron", cpu: 0.1, memory: 0.3, status: "sleeping" },
  { pid: 7168, name: "sshd", cpu: 0.4, memory: 0.8, status: "running" },
  { pid: 8192, name: "systemd", cpu: 0.2, memory: 1.2, status: "running" },
]
