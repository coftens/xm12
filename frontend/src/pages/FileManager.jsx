import React, { useState, useEffect, useCallback } from 'react'
import { useServerStore } from '@/store/useServerStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Folder, File, FileText, Download, Trash, Upload, RefreshCw, 
  ArrowLeft, Home, Edit, Archive, FolderPlus, FilePlus
} from 'lucide-react'
import api from '@/api'
import { cn } from '@/lib/utils'

export default function FileManager() {
  const currentServer = useServerStore(state => state.currentServer)
  const [currentPath, setCurrentPath] = useState('/')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = React.useRef(null)

  // Fetch file list
  const fetchFiles = useCallback(async (path) => {
    if (!currentServer) return
    setLoading(true)
    try {
      // API: GET /api/files/:server_id/list?path=/root
      const res = await api.get(`/api/files/${currentServer.id}/list`, {
        params: { path }
      })
      setFiles(res.data)
      setCurrentPath(path)
      setSelectedFiles([])
    } catch (err) {
      console.error("Failed to list files", err)
      // If permission denied or not exists, maybe go back up
    } finally {
      setLoading(false)
    }
  }, [currentServer])

  useEffect(() => {
    if (currentServer) {
      fetchFiles('/')
    }
  }, [currentServer, fetchFiles])

  // Navigation handlers
  const handleNavigate = (path) => {
    fetchFiles(path)
  }

  const handleGoUp = () => {
    if (currentPath === '/') return
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/'
    fetchFiles(parentPath)
  }

  // File operations
  const handleDownload = async (file) => {
    if (!currentServer) return
    const filePath = `${currentPath === '/' ? '' : currentPath}/${file.name}`
    try {
      const response = await api.get(`/api/files/${currentServer.id}/download`, {
        params: { path: filePath },
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', file.name)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error("Download failed", err)
      alert("下载失败")
    }
  }
  
  const handleDelete = async () => {
    if (!currentServer || selectedFiles.length === 0) return
    if (!window.confirm(`确定删除选中的 ${selectedFiles.length} 个文件吗？`)) return

    try {
      // Batch delete not implemented in backend yet, loop for now or add batch API
      // Assuming single delete for now or loop
      for (const fileName of selectedFiles) {
        const filePath = `${currentPath === '/' ? '' : currentPath}/${fileName}`
        await api.delete(`/api/files/${currentServer.id}/delete`, {
            params: { path: filePath } // adjustments based on actual backend API
        })
      }
      fetchFiles(currentPath)
      setSelectedFiles([])
    } catch (err) {
      console.error("Delete failed", err)
      alert("删除失败")
    }
  }

  const handleUpload = async (event) => {
    if (!currentServer || !event.target.files.length) return
    const file = event.target.files[0]
    const formData = new FormData()
    formData.append('file', file)
    formData.append('path', currentPath) // Check if backend supports path in body or query

    setUploading(true)
    try {
      // POST /api/files/:id/upload
      await api.post(`/api/files/${currentServer.id}/upload`, formData, {
        params: { path: currentPath }, // Pass path as query param if backend expects it
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      fetchFiles(currentPath)
      alert("上传成功")
    } catch (err) {
      console.error("Upload failed", err)
      alert("上传失败")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // UI Helpers
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (timestamp) => {
      if (!timestamp) return '-'
      return new Date(timestamp * 1000).toLocaleString()
  }

  const getFileIcon = (file) => {
      if (file.is_dir) return <Folder className="w-5 h-5 text-blue-400 fill-blue-400/20" />
      // Add more specific icons based on extension
      return <FileText className="w-5 h-5 text-gray-400" />
  }

  if (!currentServer) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center text-center space-y-4">
        <div className="bg-muted p-6 rounded-full">
           <Folder className="w-12 h-12 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">请选择服务器</h2>
          <p className="text-muted-foreground mt-2">需要连接到服务器才能管理文件</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 h-[calc(100vh-100px)] flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 bg-card p-2 rounded-lg border shadow-sm">
         <div className="flex items-center gap-2 flex-1 overflow-hidden">
             <Button variant="ghost" size="icon" onClick={handleGoUp} disabled={currentPath === '/'}>
                 <ArrowLeft className="w-4 h-4" />
             </Button>
             <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm w-full font-mono overflow-x-auto whitespace-nowrap">
                 <span className="text-muted-foreground">Path:</span>
                 {currentPath}
             </div>
             <Button variant="ghost" size="icon" onClick={() => fetchFiles(currentPath)}>
                 <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
             </Button>
         </div>
         <div className="flex items-center gap-2">
             <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleUpload} 
             />
             <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                 <Upload className="w-4 h-4 mr-2" />
                 {uploading ? '上传中...' : '上传'}
             </Button>
             <Button size="sm" variant="ghost" onClick={() => alert("Todo: Create Folder")}>
                 <FolderPlus className="w-4 h-4" />
             </Button>
             {selectedFiles.length > 0 && (
                <Button size="sm" variant="destructive" onClick={handleDelete}>
                    <Trash className="w-4 h-4 mr-2" />
                    删除 ({selectedFiles.length})
                </Button>
             )}
         </div>
      </div>

      {/* File List */}
      <div className="flex-1 rounded-lg border bg-card overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 sticky top-0 z-10 text-xs uppercase text-muted-foreground font-medium">
               <tr>
                   <th className="w-10 p-3 text-center">
                       <input 
                          type="checkbox" 
                          checked={selectedFiles.length === files.length && files.length > 0}
                          onChange={(e) => {
                              if (e.target.checked) setSelectedFiles(files.map(f => f.name))
                              else setSelectedFiles([])
                          }}
                          className="rounded border-gray-300"
                       />
                   </th>
                   <th className="p-3">文件名</th>
                   <th className="p-3 w-24 text-right">大小</th>
                   <th className="p-3 w-40 text-center">权限</th>
                   <th className="p-3 w-40 text-center">所有者</th>
                   <th className="p-3 w-48 text-right">修改时间</th>
                   <th className="p-3 w-32 text-center">操作</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-border">
               {files.length === 0 && !loading && (
                   <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">此目录下没有文件</td></tr>
               )}
               {files.map((file) => (
                   <tr 
                      key={file.name} 
                      className={cn("hover:bg-muted/50 transition-colors group", selectedFiles.includes(file.name) && "bg-muted")}
                   >
                       <td className="p-3 text-center">
                           <input 
                              type="checkbox" 
                              checked={selectedFiles.includes(file.name)}
                              onChange={(e) => {
                                  if (e.target.checked) setSelectedFiles(prev => [...prev, file.name])
                                  else setSelectedFiles(prev => prev.filter(n => n !== file.name))
                              }}
                              className="rounded border-gray-300"
                           />
                       </td>
                       <td className="p-3">
                           <div 
                              className="flex items-center gap-2 cursor-pointer select-none"
                              onClick={() => {
                                  if (file.is_dir) handleNavigate(`${currentPath === '/' ? '' : currentPath}/${file.name}`)
                              }}
                           >
                               {getFileIcon(file)}
                               <span className={cn(file.is_dir && "font-medium text-foreground", !file.is_dir && "text-muted-foreground")}>
                                   {file.name}
                               </span>
                           </div>
                       </td>
                       <td className="p-3 text-right text-muted-foreground font-mono text-xs">
                           {file.is_dir ? '-' : formatSize(file.size)}
                       </td>
                       <td className="p-3 text-center text-xs font-mono text-muted-foreground">{file.permissions}</td>
                       <td className="p-3 text-center text-xs text-muted-foreground">{file.owner}:{file.group}</td>
                       <td className="p-3 text-right text-xs text-muted-foreground tabular-nums">{formatDate(file.mtime)}</td>
                       <td className="p-3 text-center">
                           <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               {!file.is_dir && (
                                   <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDownload(file)} title="下载">
                                       <Download className="w-3.5 h-3.5" />
                                   </Button>
                               )}
                               <Button size="icon" variant="ghost" className="h-7 w-7" title="重命名/移动">
                                   <Edit className="w-3.5 h-3.5" />
                               </Button>
                           </div>
                       </td>
                   </tr>
               ))}
            </tbody>
          </table>
        </div>
        <div className="bg-muted/30 p-2 text-xs text-muted-foreground border-t flex justify-between px-4">
            <span>总计 {files.length} 个项目</span>
            <span>已选择 {selectedFiles.length} 个</span>
        </div>
      </div>
    </div>
  )
}
