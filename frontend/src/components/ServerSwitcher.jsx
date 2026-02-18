import React, { useEffect } from 'react'
import { useServerStore } from '@/store/useServerStore'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Server, ChevronDown, Check, RefreshCw } from 'lucide-react'

/**
 * 服务器切换器 — 可嵌入任意页面顶部
 * @param {string} className - 额外样式
 * @param {function} onSwitch - 切换服务器后的回调 (newServer) => void
 */
export default function ServerSwitcher({ className, onSwitch }) {
    const servers = useServerStore(state => state.servers)
    const currentServer = useServerStore(state => state.currentServer)
    const setCurrentServer = useServerStore(state => state.setCurrentServer)
    const fetchServers = useServerStore(state => state.fetchServers)

    // 首次挂载时拉取服务器列表（如果还没有）
    useEffect(() => {
        if (servers.length === 0) fetchServers()
    }, []) // eslint-disable-line

    const handleSelect = (server) => {
        if (server.id === currentServer?.id) return
        setCurrentServer(server)
        onSwitch?.(server)
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className={cn(
                    'flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm transition-colors',
                    'hover:bg-accent hover:text-accent-foreground focus:outline-none',
                    className
                )}>
                    {/* 状态指示灯 */}
                    <span className={cn('size-2 rounded-full shrink-0', currentServer ? 'bg-emerald-500' : 'bg-muted-foreground')} />
                    <Server className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="max-w-[140px] truncate font-medium">
                        {currentServer ? currentServer.name : '选择服务器'}
                    </span>
                    {currentServer && (
                        <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[100px]">
                            {currentServer.host}
                        </span>
                    )}
                    <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-60">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>切换服务器</span>
                    <button onClick={e => { e.stopPropagation(); fetchServers() }}
                        className="text-muted-foreground hover:text-foreground transition-colors">
                        <RefreshCw className="size-3.5" />
                    </button>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {servers.length === 0 ? (
                    <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                        暂无服务器，请先在"服务器管理"中添加
                    </div>
                ) : (
                    servers.map(server => (
                        <DropdownMenuItem
                            key={server.id}
                            onClick={() => handleSelect(server)}
                            className="flex items-center gap-2 cursor-pointer"
                        >
                            <span className={cn('size-2 rounded-full shrink-0',
                                currentServer?.id === server.id ? 'bg-emerald-500' : 'bg-muted-foreground/40')} />
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="truncate font-medium text-sm">{server.name}</span>
                                <span className="truncate text-xs text-muted-foreground">{server.host}:{server.port}</span>
                            </div>
                            {currentServer?.id === server.id && (
                                <Check className="size-4 text-primary shrink-0" />
                            )}
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
