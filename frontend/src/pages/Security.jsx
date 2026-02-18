import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Shield, ShieldAlert, Flame, FileSearch, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { SecurityOverview } from './security/SecurityOverview'
import { FirewallRules } from './security/FirewallRules'
import { AuditLogs } from './security/AuditLogs'
import { VulnerabilityScan } from './security/VulnerabilityScan'
import { SecuritySettingsPage } from './security/SecuritySettings'

const navItems = [
  { id: 'overview', label: '安全概览', icon: Shield, description: '实时监控云服务器安全态势' },
  { id: 'firewall', label: '防火墙规则', icon: Flame, description: '管理入站和出站流量策略' },
  { id: 'audit', label: '审计日志', icon: FileSearch, description: '查看安全操作记录和事件追踪' },
  { id: 'vulnerability', label: '漏洞扫描', icon: ShieldAlert, description: '检测和管理系统安全漏洞' },
  { id: 'settings', label: '安全设置', icon: Settings, description: '配置服务器安全策略' },
]

export default function Security() {
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const current = navItems.find(n => n.id === activeTab) || navItems[0]

  return (
    <div className="flex h-full overflow-hidden bg-background">
      <aside className={cn('flex flex-col border-r border-border bg-card transition-all duration-300 shrink-0', sidebarCollapsed ? 'w-14' : 'w-56')}>
        <div className={cn('flex items-center border-b border-border h-14 px-3', sidebarCollapsed ? 'justify-center' : 'justify-between')}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center"><Shield className="w-4 h-4 text-primary" /></div>
              <span className="text-sm font-semibold">安全中心</span>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(v => !v)} className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)} title={sidebarCollapsed ? item.label : undefined}
                className={cn('flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors text-left w-full',
                  isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  sidebarCollapsed && 'justify-center px-0')}>
                <Icon className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            )
          })}
        </nav>
      </aside>
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="flex items-center gap-3 border-b border-border bg-card px-6 h-14 shrink-0">
          <div className="flex items-center gap-2">
            {React.createElement(current.icon, { className: 'w-4 h-4 text-primary' })}
            <h1 className="text-sm font-semibold">{current.label}</h1>
          </div>
          <span className="text-muted-foreground/40">|</span>
          <p className="text-xs text-muted-foreground">{current.description}</p>
        </header>
        <main className="flex-1 overflow-auto">
          {activeTab === 'overview' && <SecurityOverview />}
          {activeTab === 'firewall' && <FirewallRules />}
          {activeTab === 'audit' && <AuditLogs />}
          {activeTab === 'vulnerability' && <VulnerabilityScan />}
          {activeTab === 'settings' && <SecuritySettingsPage />}
        </main>
      </div>
    </div>
  )
}
