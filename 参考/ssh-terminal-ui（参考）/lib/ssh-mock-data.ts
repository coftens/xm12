import type { SSHServer, SSHSession, TerminalLine } from "./ssh-types"

export const mockServers: SSHServer[] = [
  {
    id: "srv-1",
    name: "Production API",
    host: "10.0.1.100",
    port: 22,
    username: "deploy",
    authType: "key",
    group: "Production",
    status: "online",
    lastConnected: "2 min ago",
    os: "Ubuntu 22.04",
    tags: ["api", "critical"],
  },
  {
    id: "srv-2",
    name: "Production DB",
    host: "10.0.1.101",
    port: 22,
    username: "admin",
    authType: "key",
    group: "Production",
    status: "online",
    lastConnected: "1 hour ago",
    os: "Ubuntu 22.04",
    tags: ["database", "critical"],
  },
  {
    id: "srv-3",
    name: "Staging Web",
    host: "10.0.2.50",
    port: 22,
    username: "dev",
    authType: "password",
    group: "Staging",
    status: "online",
    lastConnected: "30 min ago",
    os: "Debian 12",
    tags: ["web"],
  },
  {
    id: "srv-4",
    name: "Staging Worker",
    host: "10.0.2.51",
    port: 2222,
    username: "dev",
    authType: "password",
    group: "Staging",
    status: "offline",
    lastConnected: "2 days ago",
    os: "Debian 12",
    tags: ["worker"],
  },
  {
    id: "srv-5",
    name: "Dev Server",
    host: "192.168.1.10",
    port: 22,
    username: "developer",
    authType: "key",
    group: "Development",
    status: "online",
    lastConnected: "Just now",
    os: "Arch Linux",
    tags: ["dev"],
  },
  {
    id: "srv-6",
    name: "CI/CD Runner",
    host: "10.0.3.20",
    port: 22,
    username: "runner",
    authType: "key",
    group: "Infrastructure",
    status: "online",
    lastConnected: "5 min ago",
    os: "CentOS 9",
    tags: ["ci", "automation"],
  },
  {
    id: "srv-7",
    name: "Monitor Node",
    host: "10.0.3.21",
    port: 22,
    username: "monitor",
    authType: "key",
    group: "Infrastructure",
    status: "online",
    lastConnected: "10 min ago",
    os: "Ubuntu 24.04",
    tags: ["monitoring"],
  },
]

export const mockSessions: SSHSession[] = [
  {
    id: "sess-1",
    serverId: "srv-1",
    serverName: "Production API",
    host: "10.0.1.100",
    status: "connected",
    startedAt: "2026-02-19T08:30:00Z",
  },
]

export function generateWelcomeLines(server: SSHServer): TerminalLine[] {
  const now = new Date().toISOString()
  return [
    {
      id: `line-sys-1`,
      type: "system",
      content: `Connecting to ${server.host}:${server.port}...`,
      timestamp: now,
    },
    {
      id: `line-sys-2`,
      type: "system",
      content: `Authenticating as ${server.username} via ${server.authType === "key" ? "SSH key" : "password"}...`,
      timestamp: now,
    },
    {
      id: `line-sys-3`,
      type: "system",
      content: "Connection established.",
      timestamp: now,
    },
    {
      id: `line-out-1`,
      type: "output",
      content: `Welcome to ${server.os || "Linux"} (GNU/Linux 5.15.0-91-generic x86_64)`,
      timestamp: now,
    },
    {
      id: `line-out-2`,
      type: "output",
      content: "",
      timestamp: now,
    },
    {
      id: `line-out-3`,
      type: "output",
      content: ` * Documentation:  https://help.ubuntu.com`,
      timestamp: now,
    },
    {
      id: `line-out-4`,
      type: "output",
      content: ` * Management:     https://landscape.canonical.com`,
      timestamp: now,
    },
    {
      id: `line-out-5`,
      type: "output",
      content: ` * Support:        https://ubuntu.com/advantage`,
      timestamp: now,
    },
    {
      id: `line-out-6`,
      type: "output",
      content: "",
      timestamp: now,
    },
    {
      id: `line-out-7`,
      type: "output",
      content: `System load:  0.12              Processes:            234`,
      timestamp: now,
    },
    {
      id: `line-out-8`,
      type: "output",
      content: `Usage of /:   34.2% of 49.12GB  Users logged in:      1`,
      timestamp: now,
    },
    {
      id: `line-out-9`,
      type: "output",
      content: `Memory usage: 42%               IPv4 address for eth0: ${server.host}`,
      timestamp: now,
    },
    {
      id: `line-out-10`,
      type: "output",
      content: `Swap usage:   0%`,
      timestamp: now,
    },
    {
      id: `line-out-11`,
      type: "output",
      content: "",
      timestamp: now,
    },
    {
      id: `line-out-12`,
      type: "output",
      content: `Last login: Wed Feb 19 08:30:12 2026 from 192.168.1.5`,
      timestamp: now,
    },
    {
      id: `line-prompt-1`,
      type: "prompt",
      content: `${server.username}@${server.name.toLowerCase().replace(/\s/g, "-")}:~$`,
      timestamp: now,
    },
  ]
}

export function simulateCommand(
  command: string,
  server: SSHServer
): TerminalLine[] {
  const now = new Date().toISOString()
  const lines: TerminalLine[] = []
  const promptPrefix = `${server.username}@${server.name.toLowerCase().replace(/\s/g, "-")}:~$`

  lines.push({
    id: `cmd-${Date.now()}`,
    type: "input",
    content: `${promptPrefix} ${command}`,
    timestamp: now,
  })

  const cmd = command.trim().toLowerCase()

  if (cmd === "ls" || cmd === "ls -la") {
    const lsOutput = cmd === "ls -la" ? [
      "total 48",
      "drwxr-xr-x  6 deploy deploy 4096 Feb 19 08:30 .",
      "drwxr-xr-x  3 root   root   4096 Jan 15 10:22 ..",
      "-rw-------  1 deploy deploy 1234 Feb 19 08:30 .bash_history",
      "-rw-r--r--  1 deploy deploy  220 Jan 15 10:22 .bash_logout",
      "-rw-r--r--  1 deploy deploy 3771 Jan 15 10:22 .bashrc",
      "drwxr-xr-x  3 deploy deploy 4096 Feb 01 14:05 .config",
      "drwx------  2 deploy deploy 4096 Jan 15 10:22 .ssh",
      "drwxr-xr-x  4 deploy deploy 4096 Feb 18 22:10 app",
      "-rw-r--r--  1 deploy deploy  512 Feb 18 22:10 docker-compose.yml",
      "drwxr-xr-x  2 deploy deploy 4096 Feb 15 09:30 logs",
      "-rwxr-xr-x  1 deploy deploy  256 Feb 10 11:20 deploy.sh",
    ] : [
      "app  deploy.sh  docker-compose.yml  logs",
    ]
    lsOutput.forEach((line, i) => {
      lines.push({
        id: `out-${Date.now()}-${i}`,
        type: "output",
        content: line,
        timestamp: now,
      })
    })
  } else if (cmd === "pwd") {
    lines.push({
      id: `out-${Date.now()}`,
      type: "output",
      content: `/home/${server.username}`,
      timestamp: now,
    })
  } else if (cmd === "whoami") {
    lines.push({
      id: `out-${Date.now()}`,
      type: "output",
      content: server.username,
      timestamp: now,
    })
  } else if (cmd === "uptime") {
    lines.push({
      id: `out-${Date.now()}`,
      type: "output",
      content: " 08:45:23 up 42 days,  3:21,  1 user,  load average: 0.12, 0.08, 0.05",
      timestamp: now,
    })
  } else if (cmd === "free -h") {
    const freeOutput = [
      "              total        used        free      shared  buff/cache   available",
      "Mem:           7.7Gi       3.2Gi       1.1Gi       256Mi       3.4Gi       3.9Gi",
      "Swap:          2.0Gi          0B       2.0Gi",
    ]
    freeOutput.forEach((line, i) => {
      lines.push({
        id: `out-${Date.now()}-${i}`,
        type: "output",
        content: line,
        timestamp: now,
      })
    })
  } else if (cmd === "df -h") {
    const dfOutput = [
      "Filesystem      Size  Used Avail Use% Mounted on",
      "/dev/sda1        49G   17G   30G  37% /",
      "tmpfs           3.9G  256M  3.6G   7% /dev/shm",
      "/dev/sda2       100G   45G   51G  47% /data",
    ]
    dfOutput.forEach((line, i) => {
      lines.push({
        id: `out-${Date.now()}-${i}`,
        type: "output",
        content: line,
        timestamp: now,
      })
    })
  } else if (cmd === "uname -a") {
    lines.push({
      id: `out-${Date.now()}`,
      type: "output",
      content: `Linux ${server.name.toLowerCase().replace(/\s/g, "-")} 5.15.0-91-generic #101-Ubuntu SMP x86_64 GNU/Linux`,
      timestamp: now,
    })
  } else if (cmd === "top" || cmd === "htop") {
    const topOutput = [
      `top - 08:45:23 up 42 days,  3:21,  1 user,  load average: 0.12, 0.08, 0.05`,
      `Tasks: 234 total,   1 running, 233 sleeping,   0 stopped,   0 zombie`,
      `%Cpu(s):  2.3 us,  0.8 sy,  0.0 ni, 96.5 id,  0.2 wa,  0.0 hi,  0.2 si`,
      `MiB Mem :   7884.4 total,   1124.8 free,   3276.1 used,   3483.5 buff/cache`,
      `MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   3987.2 avail Mem`,
      ``,
      `    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND`,
      `   1234 deploy    20   0  862412 124560  45032 S   1.3   1.5   2:34.21 node`,
      `   1235 deploy    20   0  723104  98432  32108 S   0.7   1.2   1:12.45 nginx`,
      `   1236 root      20   0  412320  56780  23456 S   0.3   0.7   0:45.12 dockerd`,
      `      1 root      20   0  169348  12876   8432 S   0.0   0.2   0:12.34 systemd`,
    ]
    topOutput.forEach((line, i) => {
      lines.push({
        id: `out-${Date.now()}-${i}`,
        type: "output",
        content: line,
        timestamp: now,
      })
    })
  } else if (cmd === "clear") {
    return [{ id: `clear-${Date.now()}`, type: "system", content: "__CLEAR__", timestamp: now }]
  } else if (cmd === "exit") {
    lines.push({
      id: `sys-${Date.now()}`,
      type: "system",
      content: "Connection closed.",
      timestamp: now,
    })
    return lines
  } else if (cmd === "neofetch") {
    const neofetchOutput = [
      "            .-/+oossssoo+/-.              ",
      "        `:+ssssssssssssssssss+:`          ",
      "      -+ssssssssssssssssssyyssss+-        ",
      `    .ossssssssssssssssss${server.username}dMMMNysssso.      ${server.username}@${server.name.toLowerCase().replace(/\s/g, "-")}`,
      `   /ssssssssssshdmmNNmmyNMMMMhssssss/     OS: ${server.os || "Ubuntu 22.04"} x86_64`,
      "  +ssssssssshmydMMMMMMMNddddyssssssss+    Kernel: 5.15.0-91-generic",
      "  /sssssssshNMMMyhhyyyyhmNMMMNhssssssss/   Uptime: 42 days, 3 hours",
      " .ssssssssdMMMNhsssssssssshNMMMdssssssss.  Packages: 1234 (apt)",
      " +sssshhhyNMMNyssssssssssssyNMMMysssssss+  Shell: bash 5.1.16",
      "  ossyNMMMNyMMhsssssssssssshmmmhssssssso   Terminal: /dev/pts/0",
      "  ossyNMMMNyMMhsssssssssssshmmmhssssssso   CPU: Intel Xeon E5-2680 (4)",
      " +sssshhhyNMMNyssssssssssssyNMMMysssssss+  Memory: 3276MiB / 7884MiB",
      " .ssssssssdMMMNhsssssssssshNMMMdssssssss. ",
      "  /sssssssshNMMMyhhyyyyhdNMMMNhssssssss/  ",
      "   +sssssssssdmydMMMMMMMMddddyssssssss+   ",
      "    /ssssssssssshdmNNNNmyNMMMMhssssss/    ",
      "     .ossssssssssssssssssdMMMNysssso.     ",
      "       -+sssssssssssssssssyyyssss+-       ",
      "         `:+ssssssssssssssssss+:`         ",
      "             .-/+oossssoo+/-.             ",
    ]
    neofetchOutput.forEach((line, i) => {
      lines.push({
        id: `out-${Date.now()}-${i}`,
        type: "output",
        content: line,
        timestamp: now,
      })
    })
  } else if (cmd === "help") {
    const helpOutput = [
      "Available demo commands:",
      "  ls, ls -la    - List directory contents",
      "  pwd           - Print working directory",
      "  whoami        - Print current user",
      "  uptime        - System uptime",
      "  free -h       - Memory usage",
      "  df -h         - Disk usage",
      "  uname -a      - System info",
      "  top           - Process list",
      "  neofetch      - System info (fancy)",
      "  clear         - Clear terminal",
      "  exit          - Close session",
      "  help          - Show this message",
    ]
    helpOutput.forEach((line, i) => {
      lines.push({
        id: `out-${Date.now()}-${i}`,
        type: "output",
        content: line,
        timestamp: now,
      })
    })
  } else if (cmd !== "") {
    lines.push({
      id: `err-${Date.now()}`,
      type: "error",
      content: `bash: ${command.split(" ")[0]}: command not found`,
      timestamp: now,
    })
  }

  lines.push({
    id: `prompt-${Date.now()}`,
    type: "prompt",
    content: promptPrefix,
    timestamp: now,
  })

  return lines
}
