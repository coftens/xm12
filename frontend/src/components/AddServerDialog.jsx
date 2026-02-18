import React, { useState } from 'react'
import { X } from 'lucide-react'
import api from '@/api'

export default function AddServerDialog({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 22,
    username: 'root',
    password: '',
    description: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'port' ? parseInt(value) || 22 : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('请输入服务器名称')
      return
    }
    if (!formData.host.trim()) {
      setError('请输入主机地址')
      return
    }
    if (!formData.username.trim()) {
      setError('请输入用户名')
      return
    }
    if (!formData.password.trim()) {
      setError('请输入密码')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/api/servers', {
        name: formData.name,
        host: formData.host,
        port: formData.port,
        username: formData.username,
        password: formData.password,
        description: formData.description
      })

      if (onSuccess) onSuccess(response.data)
      onClose()
      setFormData({
        name: '',
        host: '',
        port: 22,
        username: 'root',
        password: '',
        description: ''
      })
    } catch (err) {
      setError(err.response?.data?.detail || '添加服务器失败，请检查输入')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 rounded-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">添加服务器</h2>
          <button
            onClick={onClose}
            className="opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium">服务器名称 *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="例如：生产服务器1"
              className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-sm font-medium">主机地址 *</label>
              <input
                type="text"
                name="host"
                value={formData.host}
                onChange={handleChange}
                placeholder="IP 或域名"
                className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium">端口 *</label>
              <input
                type="number"
                name="port"
                value={formData.port}
                onChange={handleChange}
                min="1"
                max="65535"
                className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">用户名 *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="SSH 用户名"
              className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="text-sm font-medium">密码 *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="SSH 密码"
              className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="text-sm font-medium">描述 (可选)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="服务器用途或备注"
              rows="2"
              className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md font-medium transition-colors"
            >
              {loading ? '正在验证连接...' : '添加服务器'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-muted text-muted-foreground hover:bg-muted/80 px-4 py-2 rounded-md font-medium transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
