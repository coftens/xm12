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
  const [selectedFiles, setSelectedFiles] = useState([]) // Array of file objects
  const [uploading, setUploading] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
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
      // Check if it's the new format { path: "/", files: [...] }
      if (res.data && Array.isArray(res.data.files)) {
        setFiles(res.data.files)
      } else if (Array.isArray(res.data)) {
        // Fallback for old format if any
        setFiles(res.data)
      } else {
        console.error("Invalid file list format", res.data)
        setFiles([])
      }
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

  // Drag and Drop Handlers
  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragActive) setIsDragActive(true)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleUploadValid(e.dataTransfer.files)
        e.dataTransfer.clearData()
    }
  }

  const handleUploadValid = async (fileList) => {
    if (!currentServer || !fileList.length) return
    
    setUploading(true)
    let uploadCount = 0
    
    try {
        // Upload files sequentially or in parallel (sequentially for now to avoid overloading backend connection)
        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i]
            const formData = new FormData()
            formData.append('file', file)
            // Path checks depending on API requirements
            
            await api.post(`/api/files/${currentServer.id}/upload`, formData, {
                params: { path: currentPath },
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            uploadCount++
        }
        
        if (uploadCount > 0) {
            fetchFiles(currentPath)
            // Ideally show a toast notification here
            // alert(`成功上传 ${uploadCount} 个文件`)
        }
    } catch (err) {
        console.error("Upload failed", err)
        alert("上传失败: " + (err.response?.data?.detail || err.message))
    } finally {
        setUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }
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
    const fileList = event.target.files
    await handleUploadValid(fileList)
  }

  // UI Helpers
  const formatSize = (bytes) => {
    if (!Number.isFinite(bytes) || bytes < 0) return '0 B'
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
    <div 
      className="space-y-4 h-[calc(100vh-100px)] flex flex-col relative"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragActive && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm border-2 border-dashed border-primary m-2 rounded-xl animate-in fade-in zoom-in duration-200 pointer-events-none">
            <div className="bg-primary/10 p-8 rounded-full mb-6 ring-8 ring-primary/5">
                <Upload className="w-20 h-20 text-primary animate-bounce" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">请将需要上传的文件/文件夹拖到此处</h2>
            <p className="text-muted-foreground mt-2 text-lg">松开鼠标即可开始上传</p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 bg-card p-2 rounded-lg border shadow-sm shrink-0">
         <div className="flex items-center gap-2 flex-1 overflow-hidden">
             <Button variant="ghost" size="icon" onClick={handleGoUp} disabled={currentPath === '/'}>
                 <ArrowLeft className="w-4 h-4" />
             </Button>
             
             {/* Simple Breadcrumb */}
             <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded text-sm w-full font-mono overflow-x-auto whitespace-nowrap scrollbar-hide">
                 <span className="text-muted-foreground mr-1">Path:</span>
                 <span 
                    className={cn("hover:underline cursor-pointer px-1 rounded hover:bg-background", currentPath === '/' && "font-bold")}
                    onClick={() => handleNavigate('/')}
                 >
                    /
                 </span>
                 {currentPath !== '/' && currentPath.split('/').filter(Boolean).map((part, index, arr) => {
                     const path = '/' + arr.slice(0, index + 1).join('/')
                     return (
                         <React.Fragment key={path}>
                             <span className="text-muted-foreground">/</span>
                             <span 
                                className="hover:underline cursor-pointer px-1 rounded hover:bg-background hover:text-primary transition-colors"
                                onClick={() => handleNavigate(path)}
                             >
                                {part}
                             </span>
                         </React.Fragment>
                     )
                 })}
             </div>

             <Button variant="ghost" size="icon" onClick={() => fetchFiles(currentPath)} title="刷新">
                 <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
             </Button>
         </div>
         
         <div className="flex items-center gap-2">
             <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleUpload} 
                multiple
             />
             <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                 <Upload className="w-4 h-4 mr-2" />
                 {uploading ? '上传中...' : '上传文件'}
             </Button>
             <Button size="sm" variant="outline" onClick={() => window.prompt("请输入新文件夹名称") && alert("Todo: Create Folder")}>
                 <FolderPlus className="w-4 h-4 mr-2" />
                 新建
             </Button>
             {selectedFiles.length > 0 && (
                <Button size="sm" variant="destructive" onClick={handleDelete}>
                    <Trash className="w-4 h-4 mr-2" />
                    删除 ({selectedFiles.length})
                </Button>
             )}
         </div>
      </div>

      {/* File List Table */}
      <div className="flex-1 rounded-lg border bg-card overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-auto flex-1 relative">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-muted/50 sticky top-0 z-10 text-xs uppercase text-muted-foreground font-medium backdrop-blur-sm">
               <tr>
                   <th className="w-12 p-3 text-center border-b">
                       <input 
                          type="checkbox" 
                          checked={files.length > 0 && selectedFiles.length === files.length}
                          onChange={(e) => {
                              if (e.target.checked) setSelectedFiles(files.map(f => f.name))
                              else setSelectedFiles([])
                          }}
                          className="rounded border-input bg-background w-4 h-4 accent-primary"
                       />
                   </th>
                   <th className="p-3 border-b">文件名</th>
                   <th className="p-3 w-32 border-b text-right">大小</th>
                   <th className="p-3 w-32 text-center border-b">权限</th>
                   <th className="p-3 w-32 text-center border-b">所有者</th>
                   <th className="p-3 w-40 text-right border-b">修改时间</th>
                   <th className="p-3 w-32 text-center border-b bg-muted/50 sticky right-0 shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.1)]">操作</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-border">
               {files.length === 0 && !loading && (
                   <tr>
                       <td colSpan={7} className="p-12 text-center text-muted-foreground">
                           <div className="flex flex-col items-center gap-2">
                               <Folder className="w-10 h-10 opacity-20" />
                               <span>此目录下没有文件</span>
                           </div>
                       </td>
                   </tr>
               )}
               {files.map((file) => (
                   <tr 
                      key={file.name} 
                      className={cn(
                          "hover:bg-muted/50 transition-colors group", 
                          selectedFiles.includes(file.name) && "bg-primary/5"
                      )}
                   >
                       <td className="p-3 text-center">
                           <input 
                              type="checkbox" 
                              checked={selectedFiles.includes(file.name)}
                              onChange={(e) => {
                                  if (e.target.checked) setSelectedFiles(prev => [...prev, file.name])
                                  else setSelectedFiles(prev => prev.filter(n => n !== file.name))
                              }}
                              className="rounded border-input bg-background w-4 h-4 accent-primary"
                           />
                       </td>
                       <td className="p-3">
                           <div 
                              className="flex items-center gap-3 cursor-pointer select-none group/name"
                              onClick={() => {
                                  if (file.is_dir) handleNavigate(`${currentPath === '/' ? '' : currentPath}/${file.name}`)
                              }}
                           >
                               <div className="text-muted-foreground group-hover/name:text-primary transition-colors">
                                  {getFileIcon(file)}
                               </div>
                               <span className={cn(
                                   "truncate max-w-[300px] lg:max-w-[400px]",
                                   file.is_dir && "font-medium text-foreground group-hover/name:text-primary underline-offset-4 group-hover/name:underline", 
                                   !file.is_dir && "text-muted-foreground group-hover/name:text-foreground"
                               )}>
                                   {file.name}
                               </span>
                           </div>
                       </td>
                       <td className="p-3 text-right text-muted-foreground font-mono text-xs whitespace-nowrap">
                           {file.is_dir ? '-' : formatSize(file.size)}
                       </td>
                       <td className="p-3 text-center text-xs font-mono text-muted-foreground whitespace-nowrap">
                           <span className="bg-muted px-1.5 py-0.5 rounded">{file.permissions || '-'}</span>
                       </td>
                       <td className="p-3 text-center text-xs text-muted-foreground whitespace-nowrap">
                           {file.owner}:{file.group}
                       </td>
                       <td className="p-3 text-right text-xs text-muted-foreground tabular-nums whitespace-nowrap">{formatDate(file.mtime)}</td>
                       <td className="p-3 text-center sticky right-0 bg-background group-hover:bg-muted/50 shadow-[-10px_0_10px_-10px_rgba(0,0,0,0.1)] transition-colors">
                           <div className="flex items-center justify-center gap-1">
                               {!file.is_dir && (
                                   <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleDownload(file)} title="下载">
                                       <Download className="w-3.5 h-3.5" />
                                   </Button>
                               )}
                               <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-orange-500" title="编辑/重命名">
                                   <Edit className="w-3.5 h-3.5" />
                               </Button>
                               <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="删除" onClick={() => {
                                   setSelectedFiles([file.name]);
                                   // Logic to open delete confirm
                                   handleDelete() 
                               }}>
                                   <Trash className="w-3.5 h-3.5" />
                               </Button>
                           </div>
                       </td>
                   </tr>
               ))}
            </tbody>
          </table>
        </div>
        <div className="bg-muted/30 p-2 text-xs text-muted-foreground border-t flex justify-between px-4 items-center h-9">
            <div className="flex gap-4">
                <span>总计 {files.length} 个项目</span>
            </div>
            <span>已选择 {selectedFiles.length} 项</span>
        </div>
      </div>
    </div>
  )
}

// Internal Helper Component for Icon
const FolderWrapper = ({ className }) => <Folder className={className} />
