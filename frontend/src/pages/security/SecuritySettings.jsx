import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCcw, ShieldCheck, Lock, Server as ServerIcon } from 'lucide-react'
import api from '@/api'

const settingsMeta = {
    permit_root_login: { name: 'Root 登录', description: '是否允许通过 SSH 以 root 身份直接登录', category: 'SSH 配置', dangerous: true },
    password_auth: { name: '密码认证', description: '是否允许使用密码进行 SSH 认证（建议使用密钥）', category: 'SSH 配置' },
    permit_empty_passwords: { name: '允许空密码', description: '是否允许空密码登录（极不安全）', category: 'SSH 配置', dangerous: true, readonly: true },
    fail2ban_active: { name: 'fail2ban 防护', description: '暴力破解防护服务，自动封禁恶意 IP', category: '安全服务' },
    firewall_active: { name: '防火墙', description: 'UFW / firewalld 防火墙服务状态', category: '安全服务' },
    selinux: { name: 'SELinux', description: '安全增强 Linux 状态', category: '安全服务', readonly: true, isText: true },
    auto_update: { name: '自动安全更新', description: '是否启用自动安全包更新', category: '系统', readonly: true },
    ssh_port: { name: 'SSH 端口', description: '当前 SSH 监听端口', category: 'SSH 配置', readonly: true, isText: true },
    max_auth_tries: { name: '最大认证尝试', description: 'SSH 允许的最大密码尝试次数', category: 'SSH 配置', readonly: true, isText: true },
}

export function SecuritySettingsPage() {
    const [servers, setServers] = useState([])
    const [selectedServerId, setSelectedServerId] = useState(null)
    const [settings, setSettings] = useState(null)
    const [loading, setLoading] = useState(false)
    const [updating, setUpdating] = useState(null)

    useEffect(() => {
        const fetchServers = async () => {
            try {
                const res = await api.get('/api/servers')
                setServers(res.data)
                if (res.data.length > 0) setSelectedServerId(res.data[0].id)
            } catch (e) { console.error(e) }
        }
        fetchServers()
    }, [])

    const fetchSettings = async () => {
        if (!selectedServerId) return
        setLoading(true)
        try {
            const res = await api.get(`/api/security/settings?server_id=${selectedServerId}`)
            setSettings(res.data.settings)
        } catch (e) {
            console.error('获取安全设置失败:', e)
            setSettings(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { if (selectedServerId) fetchSettings() }, [selectedServerId])

    const toggleSetting = async (key, newValue) => {
        setUpdating(key)
        try {
            await api.put('/api/security/settings', { server_id: selectedServerId, key, value: newValue })
            setSettings(prev => ({ ...prev, [key]: newValue }))
        } catch (e) {
            alert(e.response?.data?.detail || '更新失败')
        } finally {
            setUpdating(null)
        }
    }

    // 按 category 分组
    const categories = {}
    Object.entries(settingsMeta).forEach(([key, meta]) => {
        if (!categories[meta.category]) categories[meta.category] = []
        categories[meta.category].push({ key, ...meta })
    })

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* 服务器选择 */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sm font-medium text-muted-foreground">选择服务器:</span>
                            {servers.map(s => (
                                <button key={s.id} onClick={() => setSelectedServerId(s.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedServerId === s.id ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground hover:text-foreground border border-border'}`}>
                                    {s.name}
                                </button>
                            ))}
                        </div>
                        <Button variant="outline" size="sm" onClick={fetchSettings} disabled={loading}>
                            <RefreshCcw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />刷新
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <RefreshCcw className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground ml-2">读取服务器安全配置...</span>
                </div>
            ) : !settings ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                        <p className="text-sm text-muted-foreground">选择服务器以查看安全设置</p>
                    </CardContent>
                </Card>
            ) : (
                Object.entries(categories).map(([category, items]) => (
                    <Card key={category}>
                        <CardContent className="p-0">
                            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-sm font-medium">{category}</span>
                            </div>
                            <div className="divide-y divide-border">
                                {items.map(item => {
                                    const value = settings[item.key]
                                    return (
                                        <div key={item.key} className="flex items-center justify-between px-5 py-4 hover:bg-secondary/20 transition-colors">
                                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">{item.name}</span>
                                                    {item.dangerous && value === true && (
                                                        <Badge className="text-[9px] px-1 py-0 h-3.5 bg-red-500/10 text-red-500 border-0">⚠ 不安全</Badge>
                                                    )}
                                                    {item.readonly && (
                                                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 text-muted-foreground">只读</Badge>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground">{item.description}</span>
                                            </div>
                                            <div className="shrink-0 ml-3">
                                                {item.isText ? (
                                                    <Badge variant="outline" className="text-xs font-mono">{String(value)}</Badge>
                                                ) : item.readonly ? (
                                                    <Badge className={`text-xs border-0 ${value ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                        {value ? '启用' : '禁用'}
                                                    </Badge>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        {updating === item.key && <RefreshCcw className="w-3 h-3 animate-spin text-muted-foreground" />}
                                                        <Switch
                                                            checked={!!value}
                                                            onCheckedChange={v => toggleSetting(item.key, v)}
                                                            disabled={updating === item.key}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    )
}
