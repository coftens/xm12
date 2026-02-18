export interface SSHServer {
  id: string
  name: string
  host: string
  port: number
  username: string
  authType: "password" | "key"
  group: string
  status: "online" | "offline" | "connecting"
  lastConnected?: string
  os?: string
  tags?: string[]
}

export interface SSHSession {
  id: string
  serverId: string
  serverName: string
  host: string
  status: "connected" | "disconnected" | "connecting"
  startedAt: string
}

export interface TerminalLine {
  id: string
  type: "input" | "output" | "error" | "system" | "prompt"
  content: string
  timestamp: string
}

export interface ServerGroup {
  name: string
  servers: SSHServer[]
}
