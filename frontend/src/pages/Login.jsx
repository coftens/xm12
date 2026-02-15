import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutDashboard, Loader2 } from 'lucide-react'
import api from '@/api'
import { useAuthStore } from '@/store/useAuthStore'
import { cn } from '@/lib/utils'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const setAuth = useAuthStore((state) => state.setAuth)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Create form data as backend expects form-data for OAuth2 usually, 
      // but let's check the Vue implementation to be sure.
      // Vue used: api.post('/api/token', formData) with username/password.
      
      const formData = new FormData()
      formData.append('username', username)
      formData.append('password', password)

      const res = await api.post('/api/token', formData)
      const { access_token, user } = res.data
      
      setAuth(user, access_token)
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      setError('登录失败，请检查用户名或密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground mb-4">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">ServerPanel</h1>
          <p className="text-sm text-muted-foreground">服务器远程管理平台</p>
        </div>

        <div className="rounded-xl border border-border bg-card text-card-foreground shadow">
          <div className="p-6 pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 text-sm rounded-md bg-destructive/15 text-destructive font-medium">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="username">
                  用户名
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="admin"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                  密码
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "inline-flex w-full items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                  "bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                )}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                登录
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
