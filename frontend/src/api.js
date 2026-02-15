import axios from 'axios'

// 根据环境确定 API 基础 URL
// 开发环境: 'http://localhost:8000'
// 生产环境: 使用相对路径或完整 URL
const getBaseURL = () => {
  if (typeof window === 'undefined') return '/'
  
  // 如果在开发模式，使用本地后端
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:8000'
  }
  
  // 生产环境：根据当前域名动态生成 API 地址
  // 如果前端在 2388，后端在 8888，同一个 IP
  const protocol = window.location.protocol
  const hostname = window.location.hostname
  return `${protocol}//${hostname}:8888`
}

const api = axios.create({
  baseURL: getBaseURL()
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
