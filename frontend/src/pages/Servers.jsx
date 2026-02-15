import React, { useEffect, useState } from 'react'
import api from '@/api'
import { Plus, Power, Terminal, Trash, Edit, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

export default function Servers() {
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchServers()
  }, [])

  const fetchServers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/servers')
      // Adapt API response if needed, assuming array
      setServers(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除该服务器？')) return
    try {
      await api.delete(`/api/servers/${id}`)
      fetchServers()
    } catch (err) {
      alert('删除失败')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">服务器列表</h2>
          <p className="text-muted-foreground text-sm mt-1">
            管理您的所有远程服务器实例
          </p>
        </div>
        <button 
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
          onClick={() => alert('TODO: Add Dialog')}
        >
          <Plus className="w-4 h-4 mr-2" />
          添加服务器
        </button>
      </div>

      <div className="rounded-md border border-border bg-card">
        <div className="w-full overflow-auto">
          <table className="w-full text-sm text-left caption-bottom">
            <thead className="[&_tr]:border-b border-border">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[200px]">名称</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">主机/端口</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[100px]">状态</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">备注</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {loading ? (
                <tr>
                  <td colSpan={5} className="h-24 text-center text-muted-foreground">
                    加载中...
                  </td>
                </tr>
              ) : servers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-24 text-center text-muted-foreground">
                    暂无服务器
                  </td>
                </tr>
              ) : (
                servers.map((server) => (
                  <tr key={server.id} className="border-b border-border transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">{server.name}</td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                        <span>{server.host}</span>
                        <span className="text-xs text-muted-foreground">Port: {server.port}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                        server.status === 'online' 
                          ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" 
                          : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                      )}>
                        {server.status === 'online' ? '在线' : '离线'}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">
                      {server.description || '-'}
                    </td>
                    <td className="p-4 align-middle text-right gap-2 flex justify-end">
                      <button 
                        className="p-2 hover:bg-accent rounded-md"
                        title="终端"
                        onClick={() => navigate('/terminal')}
                      >
                        <Terminal className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 hover:bg-accent rounded-md"
                        title="测试连接"
                        onClick={async () => {
                          try {
                            await api.post(`/api/servers/${server.id}/test`)
                            fetchServers()
                            alert('连接测试成功')
                          } catch {
                            alert('连接失败')
                          }
                        }}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button 
                         className="p-2 hover:bg-accent rounded-md text-destructive"
                         onClick={() => handleDelete(server.id)}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
