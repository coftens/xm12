"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Key, Lock, Server, Loader2 } from "lucide-react"
import type { SSHServer } from "@/lib/ssh-types"

interface ConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnect: (server: SSHServer) => void
}

export function ConnectionDialog({
  open,
  onOpenChange,
  onConnect,
}: ConnectionDialogProps) {
  const [connecting, setConnecting] = useState(false)
  const [form, setForm] = useState({
    name: "",
    host: "",
    port: "22",
    username: "",
    password: "",
    group: "Development",
    authType: "password" as "password" | "key",
  })

  const handleConnect = () => {
    setConnecting(true)
    setTimeout(() => {
      const server: SSHServer = {
        id: `srv-${Date.now()}`,
        name: form.name || `${form.host}`,
        host: form.host,
        port: parseInt(form.port) || 22,
        username: form.username,
        authType: form.authType,
        group: form.group,
        status: "online",
        lastConnected: "Just now",
        os: "Ubuntu 22.04",
      }
      onConnect(server)
      setConnecting(false)
      setForm({
        name: "",
        host: "",
        port: "22",
        username: "",
        password: "",
        group: "Development",
        authType: "password",
      })
    }, 1500)
  }

  const isValid = form.host && form.username

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15">
              <Server className="size-4 text-primary" />
            </div>
            New SSH Connection
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter server details to establish a new SSH connection.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Connection Name */}
          <div className="space-y-2">
            <Label htmlFor="conn-name" className="text-xs text-muted-foreground">
              Connection Name
            </Label>
            <Input
              id="conn-name"
              placeholder="My Server"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-9 bg-input border-border text-foreground text-sm placeholder:text-muted-foreground"
            />
          </div>

          {/* Host and Port */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="conn-host" className="text-xs text-muted-foreground">
                Host <span className="text-destructive">*</span>
              </Label>
              <Input
                id="conn-host"
                placeholder="192.168.1.100"
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
                className="h-9 bg-input border-border text-foreground font-mono text-sm placeholder:text-muted-foreground"
              />
            </div>
            <div className="w-20 space-y-2">
              <Label htmlFor="conn-port" className="text-xs text-muted-foreground">
                Port
              </Label>
              <Input
                id="conn-port"
                placeholder="22"
                value={form.port}
                onChange={(e) => setForm({ ...form, port: e.target.value })}
                className="h-9 bg-input border-border text-foreground font-mono text-sm placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="conn-user" className="text-xs text-muted-foreground">
              Username <span className="text-destructive">*</span>
            </Label>
            <Input
              id="conn-user"
              placeholder="root"
              value={form.username}
              onChange={(e) =>
                setForm({ ...form, username: e.target.value })
              }
              className="h-9 bg-input border-border text-foreground font-mono text-sm placeholder:text-muted-foreground"
            />
          </div>

          {/* Auth Type */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Authentication</Label>
            <Tabs
              value={form.authType}
              onValueChange={(v) =>
                setForm({ ...form, authType: v as "password" | "key" })
              }
            >
              <TabsList className="w-full bg-input border border-border">
                <TabsTrigger
                  value="password"
                  className="flex-1 gap-1.5 text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary"
                >
                  <Lock className="size-3" />
                  Password
                </TabsTrigger>
                <TabsTrigger
                  value="key"
                  className="flex-1 gap-1.5 text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary"
                >
                  <Key className="size-3" />
                  SSH Key
                </TabsTrigger>
              </TabsList>
              <TabsContent value="password" className="mt-3">
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="h-9 bg-input border-border text-foreground text-sm placeholder:text-muted-foreground"
                />
              </TabsContent>
              <TabsContent value="key" className="mt-3">
                <div className="flex h-24 flex-col items-center justify-center rounded-md border border-dashed border-border bg-input/50 text-xs text-muted-foreground">
                  <Key className="mb-2 size-5 text-muted-foreground/50" />
                  <p>Drop your SSH key here</p>
                  <p className="text-muted-foreground/60">or click to browse</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Group */}
          <div className="space-y-2">
            <Label htmlFor="conn-group" className="text-xs text-muted-foreground">
              Group
            </Label>
            <Input
              id="conn-group"
              placeholder="Development"
              value={form.group}
              onChange={(e) => setForm({ ...form, group: e.target.value })}
              className="h-9 bg-input border-border text-foreground text-sm placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={!isValid || connecting}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            {connecting && <Loader2 className="size-3.5 animate-spin" />}
            {connecting ? "Connecting..." : "Connect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
