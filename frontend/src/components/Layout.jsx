import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Server,
  Terminal,
  Files,
  Activity,
  LogOut,
  Settings,
  Shield
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { cn } from '@/lib/utils'

export default function Layout() {
  const navigate = useNavigate()
  const logout = useAuthStore(state => state.logout)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: '概览' },
    { to: '/servers', icon: Server, label: '服务器管理' },
    { to: '/terminal', icon: Terminal, label: 'SSH 终端' },
    { to: '/files', icon: Files, label: '文件管理' },
    { to: '/monitor', icon: Activity, label: '资源监控' },
    { to: '/security', icon: Shield, label: '安全中心' },
  ]

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col fixed inset-y-0 z-50">
        <div className="h-14 flex items-center px-6 border-b border-border">
          <LayoutDashboard className="w-6 h-6 mr-2 text-primary" />
          <span className="font-bold text-lg">服务器远程管理平台</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Top Header (Optional for Breadcrumbs or User info) */}
        <header className="h-14 border-b border-border bg-background/95 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-40">
          <h2 className="font-semibold">控制台</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">管理员</span>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
              AD
            </div>
          </div>
        </header>

        <div className="p-6 flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
