"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { SecurityOverview } from "@/components/security-overview"
import { FirewallRules } from "@/components/firewall-rules"
import { AuditLogs } from "@/components/audit-logs"
import { VulnerabilityScan } from "@/components/vulnerability-scan"
import { AccessControlPage, KeyManagementPage, SecuritySettingsPage } from "@/components/placeholder-page"

const pageConfig: Record<string, { title: string; description: string }> = {
  overview: { title: "安全概览", description: "实时监控云服务器安全态势" },
  firewall: { title: "防火墙规则", description: "管理入站和出站流量策略" },
  audit: { title: "审计日志", description: "查看安全操作记录和事件追踪" },
  vulnerability: { title: "漏洞扫描", description: "检测和管理系统安全漏洞" },
  access: { title: "访问控制", description: "管理用户角色和访问权限" },
  keys: { title: "密钥管理", description: "管理 API 密钥、证书和凭证" },
  settings: { title: "安全设置", description: "配置全局安全策略" },
}

export default function SecurityDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const config = pageConfig[activeTab] || pageConfig.overview

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <AppHeader title={config.title} description={config.description} />
        <div className="flex-1 overflow-auto">
          {activeTab === "overview" && <SecurityOverview />}
          {activeTab === "firewall" && <FirewallRules />}
          {activeTab === "audit" && <AuditLogs />}
          {activeTab === "vulnerability" && <VulnerabilityScan />}
          {activeTab === "access" && <AccessControlPage />}
          {activeTab === "keys" && <KeyManagementPage />}
          {activeTab === "settings" && <SecuritySettingsPage />}
        </div>
      </main>
    </div>
  )
}
