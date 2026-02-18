import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useServerStore } from '@/store/useServerStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import api from '@/api'
import {
  Folder, File, FileText, FileCode, FileImage, FileArchive, FileVideo, FileAudio,
  ArrowLeft, ArrowRight, ArrowUp, RefreshCw, Search, FolderPlus, Upload, Download,
  Scissors, Copy, ClipboardPaste, Trash2, Edit3, LayoutGrid, List, Table2,
  Eye, EyeOff, MoreHorizontal, ChevronRight, ChevronDown, Terminal, Info,
  CheckSquare, XSquare, ToggleRight, Home, HardDrive, Star, X, Archive
} from 'lucide-react'

// ===================== 工具函数 =====================
function formatSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B'
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(modified) {
  if (!modified) return '-'
  // Backend returns string like '2024-01-15 10:30' or unix timestamp
  if (typeof modified === 'number') {
    return new Date(modified * 1000).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    })
  }
  // String date from ls --time-style=long-iso: '2024-01-15 10:30'
  return modified
}

function getFileType(file) {
  if (file.is_dir) return 'folder'
  const ext = file.name.split('.').pop()?.toLowerCase()
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp']
  const videoExts = ['mp4', 'avi', 'mov', 'mkv', 'webm']
  const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg']
  const archiveExts = ['zip', 'tar', 'gz', 'bz2', 'xz', '7z', 'rar']
  const codeExts = ['js', 'ts', 'jsx', 'tsx', 'py', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'sh', 'yaml', 'yml', 'json', 'xml', 'html', 'css']
  if (imageExts.includes(ext)) return 'image'
  if (videoExts.includes(ext)) return 'video'
  if (audioExts.includes(ext)) return 'audio'
  if (archiveExts.includes(ext)) return 'archive'
  if (codeExts.includes(ext)) return 'code'
  if (['txt', 'md', 'log', 'conf', 'cfg', 'ini'].includes(ext)) return 'text'
  return 'file'
}

// ===================== 文件图标 =====================
function FileIcon({ file, size = 'sm' }) {
  const type = getFileType(file)
  const sizeClass = size === 'lg' ? 'w-10 h-10' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4'
  const iconMap = {
    folder: <Folder className={cn(sizeClass, 'text-yellow-400 fill-yellow-400/30')} />,
    image: <FileImage className={cn(sizeClass, 'text-purple-400')} />,
    video: <FileVideo className={cn(sizeClass, 'text-pink-400')} />,
    audio: <FileAudio className={cn(sizeClass, 'text-orange-400')} />,
    archive: <FileArchive className={cn(sizeClass, 'text-amber-500')} />,
    code: <FileCode className={cn(sizeClass, 'text-blue-400')} />,
    text: <FileText className={cn(sizeClass, 'text-gray-400')} />,
    file: <File className={cn(sizeClass, 'text-gray-400')} />,
  }
  return iconMap[type] || iconMap.file
}

// ===================== 工具栏按钮 =====================
function ToolbarBtn({ icon: Icon, tooltip, onClick, disabled, active, label, variant }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'disabled:pointer-events-none disabled:opacity-40',
        active && 'bg-accent text-accent-foreground',
        variant === 'destructive' && 'hover:bg-destructive/10 hover:text-destructive',
        !label && 'px-1.5',
      )}
    >
      <Icon className="size-3.5" />
      {label && <span className="hidden md:inline">{label}</span>}
    </button>
  )
}

function ViewModeBtn({ icon: Icon, active, onClick, tooltip, position }) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={cn(
        'inline-flex items-center justify-center px-2 py-1 transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        position === 'left' && 'rounded-l-md',
        position === 'right' && 'rounded-r-md',
      )}
    >
      <Icon className="size-3.5" />
    </button>
  )
}

// ===================== 工具栏 =====================
function Toolbar({
  currentPath, viewMode, showHidden, canGoBack, canGoForward, hasSelection,
  hasClipboard, searchQuery, onBack, onForward, onUp, onRefresh, onViewModeChange,
  onToggleHidden, onNewFolder, onUpload, onDownload, onCut, onCopy, onPaste,
  onDelete, onRename, onSearchChange, onPathChange, onSelectAll, onInvertSelection,
  onClearSelection, selectedCount, totalCount, loading
}) {
  const [editingPath, setEditingPath] = useState(false)
  const [pathInput, setPathInput] = useState(currentPath)
  const pathSegments = currentPath.split('/').filter(Boolean)

  const handlePathSubmit = (e) => {
    e.preventDefault()
    onPathChange(pathInput)
    setEditingPath(false)
  }

  return (
    <div className="flex flex-col border-b border-border bg-card shrink-0">
      {/* 导航行 */}
      <div className="flex items-center gap-1 px-2 py-1.5">
        <div className="flex items-center gap-0.5">
          <ToolbarBtn icon={ArrowLeft} tooltip="后退 (Alt+←)" onClick={onBack} disabled={!canGoBack} />
          <ToolbarBtn icon={ArrowRight} tooltip="前进 (Alt+→)" onClick={onForward} disabled={!canGoForward} />
          <ToolbarBtn icon={ArrowUp} tooltip="上级目录 (Alt+↑)" onClick={onUp} />
          <ToolbarBtn icon={RefreshCw} tooltip="刷新 (F5)" onClick={onRefresh} active={loading} />
        </div>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* 地址栏 */}
        <div
          className="flex flex-1 items-center overflow-hidden rounded-md border border-input bg-background px-2 py-1 cursor-text"
          onClick={() => { setPathInput(currentPath); setEditingPath(true) }}
        >
          {editingPath ? (
            <form onSubmit={handlePathSubmit} className="w-full">
              <input
                autoFocus
                value={pathInput}
                onChange={e => setPathInput(e.target.value)}
                onBlur={() => setEditingPath(false)}
                className="w-full bg-transparent text-xs text-foreground outline-none font-mono"
              />
            </form>
          ) : (
            <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
              <button
                onClick={(e) => { e.stopPropagation(); onPathChange('/') }}
                className="shrink-0 rounded px-1 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                /
              </button>
              {pathSegments.map((seg, i) => {
                const segPath = '/' + pathSegments.slice(0, i + 1).join('/')
                const isLast = i === pathSegments.length - 1
                return (
                  <div key={segPath} className="flex shrink-0 items-center">
                    <ChevronRight className="size-3 text-muted-foreground" />
                    <button
                      onClick={(e) => { e.stopPropagation(); onPathChange(segPath) }}
                      className={cn(
                        'rounded px-1 py-0.5 text-xs transition-colors hover:bg-accent hover:text-accent-foreground',
                        isLast ? 'font-medium text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {seg}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* 搜索框 */}
        <div className="relative w-48">
          <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索文件..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="h-7 w-full rounded-md border border-input bg-background pl-7 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* 操作行 */}
      <div className="flex items-center gap-0.5 border-t border-border/50 px-2 py-1">
        <ToolbarBtn icon={FolderPlus} tooltip="新建文件夹 (Ctrl+Shift+N)" onClick={onNewFolder} label="新建文件夹" />
        <ToolbarBtn icon={Upload} tooltip="上传文件" onClick={onUpload} label="上传" />

        <div className="mx-1 h-5 w-px bg-border" />

        <ToolbarBtn icon={Scissors} tooltip="剪切 (Ctrl+X)" onClick={onCut} disabled={!hasSelection} />
        <ToolbarBtn icon={Copy} tooltip="复制 (Ctrl+C)" onClick={onCopy} disabled={!hasSelection} />
        <ToolbarBtn icon={ClipboardPaste} tooltip="粘贴 (Ctrl+V)" onClick={onPaste} disabled={!hasClipboard} />

        <div className="mx-1 h-5 w-px bg-border" />

        <ToolbarBtn icon={Edit3} tooltip="重命名 (F2)" onClick={onRename} disabled={!hasSelection} />
        <ToolbarBtn icon={Download} tooltip="下载" onClick={onDownload} disabled={!hasSelection} />
        <ToolbarBtn icon={Trash2} tooltip="删除 (Delete)" onClick={onDelete} disabled={!hasSelection} variant="destructive" />

        <div className="mx-1 h-5 w-px bg-border" />

        <ToolbarBtn
          icon={CheckSquare}
          tooltip="全选 (Ctrl+A)"
          onClick={onSelectAll}
          label={selectedCount > 0 ? `${selectedCount}/${totalCount}` : undefined}
          active={selectedCount > 0 && selectedCount === totalCount}
        />
        <ToolbarBtn icon={ToggleRight} tooltip="反选" onClick={onInvertSelection} />
        {selectedCount > 0 && (
          <ToolbarBtn icon={XSquare} tooltip="取消选择 (Esc)" onClick={onClearSelection} />
        )}

        <div className="ml-auto flex items-center gap-0.5">
          <ToolbarBtn
            icon={showHidden ? EyeOff : Eye}
            tooltip={showHidden ? '隐藏隐藏文件' : '显示隐藏文件'}
            onClick={onToggleHidden}
            active={showHidden}
          />
          <div className="mx-1 h-5 w-px bg-border" />
          <div className="flex items-center rounded-md border border-border">
            <ViewModeBtn icon={LayoutGrid} active={viewMode === 'grid'} onClick={() => onViewModeChange('grid')} tooltip="网格视图" position="left" />
            <ViewModeBtn icon={List} active={viewMode === 'list'} onClick={() => onViewModeChange('list')} tooltip="列表视图" position="middle" />
            <ViewModeBtn icon={Table2} active={viewMode === 'details'} onClick={() => onViewModeChange('details')} tooltip="详情视图" position="right" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ===================== 侧边栏 =====================
const QUICK_PATHS = [
  { label: '根目录', path: '/', icon: HardDrive },
  { label: '主目录', path: '/root', icon: Home },
  { label: '网站根目录', path: '/www/wwwroot', icon: Folder },
  { label: '临时目录', path: '/tmp', icon: Folder },
  { label: '日志目录', path: '/var/log', icon: FileText },
  { label: '配置目录', path: '/etc', icon: FileCode },
]

function Sidebar({ currentPath, onNavigate, server }) {
  return (
    <div className="flex h-full w-48 shrink-0 flex-col border-r border-border bg-card">
      {/* 服务器信息 */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <div className="size-2 rounded-full bg-emerald-500" />
        <span className="truncate text-xs font-medium text-foreground">{server?.name || '服务器'}</span>
        <span className="ml-auto shrink-0 rounded-sm bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">已连接</span>
      </div>

      {/* 快速访问 */}
      <div className="flex-1 overflow-y-auto py-1">
        <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">快速访问</div>
        {QUICK_PATHS.map(({ label, path, icon: Icon }) => (
          <button
            key={path}
            onClick={() => onNavigate(path)}
            className={cn(
              'flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              currentPath === path && 'bg-primary/10 text-primary font-medium'
            )}
          >
            <Icon className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ===================== 网格视图 =====================
function GridView({ files, selectedItems, onSelect, onOpen, onContextMenu }) {
  return (
    <div
      className="flex-1 overflow-auto p-3 select-none"
      onContextMenu={e => { e.preventDefault(); onContextMenu(e) }}
      onClick={() => onSelect(null)}
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-1">
        {files.map(file => {
          const selected = selectedItems.has(file.name)
          return (
            <div
              key={file.name}
              data-file-item
              data-file-id={file.name}
              className={cn(
                'group relative flex flex-col items-center gap-1 rounded-lg p-2 text-center transition-colors cursor-pointer',
                'hover:bg-accent/60',
                selected && 'bg-primary/15 ring-1 ring-primary/40'
              )}
              onClick={e => { e.stopPropagation(); onSelect(file.name, e.ctrlKey || e.metaKey, e.shiftKey) }}
              onDoubleClick={() => onOpen(file)}
              onContextMenu={e => { e.preventDefault(); e.stopPropagation(); if (!selected) onSelect(file.name, false); onContextMenu(e, file) }}
            >
              <FileIcon file={file} size="lg" />
              <span className={cn('w-full truncate text-[11px] leading-tight', selected ? 'text-primary' : 'text-foreground')}>
                {file.name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ===================== 列表视图 =====================
function ListView({ files, selectedItems, onSelect, onOpen, onContextMenu }) {
  return (
    <div
      className="flex-1 overflow-auto p-1 select-none"
      onContextMenu={e => { e.preventDefault(); onContextMenu(e) }}
      onClick={() => onSelect(null)}
    >
      {files.map(file => {
        const selected = selectedItems.has(file.name)
        return (
          <div
            key={file.name}
            className={cn(
              'flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-left transition-colors cursor-pointer',
              'hover:bg-accent/60',
              selected && 'bg-primary/15'
            )}
            onClick={e => { e.stopPropagation(); onSelect(file.name, e.ctrlKey || e.metaKey, e.shiftKey) }}
            onDoubleClick={() => onOpen(file)}
            onContextMenu={e => { e.preventDefault(); e.stopPropagation(); if (!selected) onSelect(file.name, false); onContextMenu(e, file) }}
          >
            <FileIcon file={file} size="md" />
            <span className={cn('flex-1 truncate text-sm', selected ? 'text-primary font-medium' : 'text-foreground')}>
              {file.name}
            </span>
            <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">
              {file.is_dir ? '--' : formatSize(file.size)}
            </span>
            <span className="w-36 shrink-0 text-right text-xs text-muted-foreground">
              {formatDate(file.mtime)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ===================== 详情视图 =====================
function DetailsView({ files, selectedItems, onSelect, onOpen, onContextMenu, sortField, sortDirection, onSort }) {
  const allSelected = files.length > 0 && selectedItems.size === files.length

  const SortHeader = ({ label, field, className }) => (
    <button
      onClick={() => onSort(field)}
      className={cn('flex items-center gap-1 transition-colors hover:text-foreground', className)}
    >
      <span>{label}</span>
      {sortField === field && (
        sortDirection === 'asc'
          ? <ArrowUp className="size-3" />
          : <ArrowDown className="size-3" />
      )}
    </button>
  )

  return (
    <div
      className="flex flex-1 flex-col overflow-hidden"
      onContextMenu={e => { e.preventDefault(); onContextMenu(e) }}
    >
      {/* 表头 */}
      <div className="flex items-center border-b border-border bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground shrink-0">
        <div className="mr-2 flex w-5 shrink-0 items-center justify-center">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={e => {
              if (e.target.checked) onSelect('__all__')
              else onSelect(null)
            }}
            className="size-4 rounded accent-primary"
          />
        </div>
        <SortHeader label="文件名" field="name" className="flex-1" />
        <SortHeader label="大小" field="size" className="w-24 text-right justify-end" />
        <span className="w-28 text-right">类型</span>
        <SortHeader label="修改时间" field="modified" className="w-40 text-right justify-end" />
        <span className="w-24 text-right">权限</span>
        <span className="w-20 text-right">所有者</span>
      </div>

      {/* 文件行 */}
      <div className="flex-1 overflow-auto select-none" onClick={() => onSelect(null)}>
        {files.map((file, index) => {
          const selected = selectedItems.has(file.name)
          const type = file.is_dir ? '文件夹' : (file.name.split('.').pop()?.toUpperCase() || '文件')
          return (
            <div
              key={file.name}
              className={cn(
                'flex w-full items-center px-3 py-1 text-[13px] transition-colors cursor-pointer',
                'hover:bg-accent/60',
                selected && 'bg-primary/15',
                !selected && index % 2 !== 0 && 'bg-muted/20'
              )}
              onClick={e => { e.stopPropagation(); onSelect(file.name, e.ctrlKey || e.metaKey, e.shiftKey) }}
              onDoubleClick={() => onOpen(file)}
              onContextMenu={e => { e.preventDefault(); e.stopPropagation(); if (!selected) onSelect(file.name, false); onContextMenu(e, file) }}
            >
              <div className="mr-2 flex w-5 shrink-0 items-center justify-center">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={e => { e.stopPropagation(); onSelect(file.name, true) }}
                  onClick={e => e.stopPropagation()}
                  className="size-4 rounded accent-primary"
                />
              </div>
              <div className="flex flex-1 items-center gap-2 min-w-0">
                <FileIcon file={file} size="sm" />
                <span className={cn('truncate', selected ? 'text-primary font-medium' : 'text-foreground')}>
                  {file.name}
                </span>
              </div>
              <span className="w-24 shrink-0 text-right text-xs text-muted-foreground font-mono">
                {file.is_dir ? '--' : formatSize(file.size)}
              </span>
              <span className="w-28 shrink-0 text-right text-xs text-muted-foreground">{type}</span>
              <span className="w-40 shrink-0 text-right text-xs text-muted-foreground">{formatDate(file.mtime)}</span>
              <span className="w-24 shrink-0 text-right font-mono text-[11px] text-muted-foreground">
                {file.permissions || '--'}
              </span>
              <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">
                {file.owner || '--'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ===================== 右键菜单 =====================
function ContextMenu({ state, onClose, onOpen, onCut, onCopy, onPaste, onDelete, onRename, onNewFolder, onUpload, onDownload, onRefresh, hasClipboard, hasSelection }) {
  useEffect(() => {
    const handler = () => onClose()
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [onClose])

  if (!state) return null

  const MenuItem = ({ icon: Icon, label, onClick, disabled, danger }) => (
    <button
      onClick={e => { e.stopPropagation(); if (!disabled) { onClick(); onClose() } }}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'disabled:pointer-events-none disabled:opacity-40',
        danger && 'hover:bg-destructive/10 hover:text-destructive'
      )}
    >
      {Icon && <Icon className="size-4 shrink-0" />}
      <span>{label}</span>
    </button>
  )

  const Divider = () => <div className="my-1 h-px bg-border" />

  return (
    <div
      className="fixed z-50 min-w-[180px] rounded-lg border border-border bg-popover shadow-lg py-1"
      style={{ left: state.x, top: state.y }}
      onClick={e => e.stopPropagation()}
    >
      {state.file && (
        <>
          <MenuItem icon={state.file.is_dir ? Folder : File} label={`打开 "${state.file.name}"`} onClick={() => onOpen(state.file)} />
          <Divider />
        </>
      )}
      <MenuItem icon={Scissors} label="剪切" onClick={onCut} disabled={!hasSelection} />
      <MenuItem icon={Copy} label="复制" onClick={onCopy} disabled={!hasSelection} />
      <MenuItem icon={ClipboardPaste} label="粘贴" onClick={onPaste} disabled={!hasClipboard} />
      <Divider />
      {state.file && !state.file.is_dir && (
        <MenuItem icon={Download} label="下载" onClick={() => onDownload(state.file)} />
      )}
      <MenuItem icon={Edit3} label="重命名" onClick={onRename} disabled={!hasSelection} />
      <MenuItem icon={Trash2} label="删除" onClick={onDelete} disabled={!hasSelection} danger />
      <Divider />
      <MenuItem icon={FolderPlus} label="新建文件夹" onClick={onNewFolder} />
      <MenuItem icon={Upload} label="上传文件" onClick={onUpload} />
      <Divider />
      <MenuItem icon={RefreshCw} label="刷新" onClick={onRefresh} />
    </div>
  )
}

// ===================== 对话框 =====================
function Modal({ open, title, onClose, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-popover text-popover-foreground border rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

function NewFolderDialog({ open, onClose, onCreate }) {
  const [name, setName] = useState('')
  const handleSubmit = e => { e.preventDefault(); if (name.trim()) { onCreate(name.trim()); setName(''); onClose() } }
  return (
    <Modal open={open} title="新建文件夹" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="文件夹名称"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>取消</Button>
          <Button size="sm" type="submit" disabled={!name.trim()}>创建</Button>
        </div>
      </form>
    </Modal>
  )
}

function RenameDialog({ open, onClose, file, onRename }) {
  const [name, setName] = useState(file?.name || '')
  useEffect(() => setName(file?.name || ''), [file])
  const handleSubmit = e => { e.preventDefault(); if (name.trim() && name !== file?.name) { onRename(name.trim()); onClose() } }
  return (
    <Modal open={open} title="重命名" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>取消</Button>
          <Button size="sm" type="submit" disabled={!name.trim() || name === file?.name}>重命名</Button>
        </div>
      </form>
    </Modal>
  )
}

function DeleteDialog({ open, onClose, files, onConfirm }) {
  return (
    <Modal open={open} title="确认删除" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          确定要删除以下 <span className="font-semibold text-foreground">{files.length}</span> 个项目吗？此操作不可撤销。
        </p>
        <div className="max-h-32 overflow-y-auto rounded-md border border-border bg-muted/30 p-2">
          {files.map(f => (
            <div key={f} className="flex items-center gap-2 py-0.5 text-sm">
              <Trash2 className="size-3.5 text-destructive shrink-0" />
              <span className="truncate font-mono text-xs">{f}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>取消</Button>
          <Button variant="destructive" size="sm" onClick={() => { onConfirm(); onClose() }}>删除</Button>
        </div>
      </div>
    </Modal>
  )
}

function UploadDialog({ open, onClose, onUpload, currentPath }) {
  const fileInputRef = useRef(null)
  const [files, setFiles] = useState([])
  const [isDrag, setIsDrag] = useState(false)

  const handleDrop = e => {
    e.preventDefault(); setIsDrag(false)
    setFiles(Array.from(e.dataTransfer.files))
  }

  const handleSubmit = () => { onUpload(files); setFiles([]); onClose() }

  return (
    <Modal open={open} title={`上传文件到 ${currentPath}`} onClose={onClose}>
      <div className="space-y-4">
        <div
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer',
            isDrag ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          )}
          onDragOver={e => { e.preventDefault(); setIsDrag(true) }}
          onDragLeave={() => setIsDrag(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="size-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">拖拽文件到此处，或点击选择文件</p>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e => setFiles(Array.from(e.target.files))} />
        </div>
        {files.length > 0 && (
          <div className="max-h-32 overflow-y-auto rounded-md border border-border bg-muted/30 p-2 space-y-1">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <File className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{f.name}</span>
                <span className="text-muted-foreground">{formatSize(f.size)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>取消</Button>
          <Button size="sm" onClick={handleSubmit} disabled={files.length === 0}>
            上传 {files.length > 0 && `(${files.length})`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ===================== 多选操作栏 =====================
function SelectionBar({ count, onCut, onCopy, onDelete, onDownload, onClear }) {
  return (
    <div className="flex items-center gap-2 border-t border-border bg-primary/5 px-4 py-2 shrink-0">
      <span className="text-sm font-medium text-primary">已选择 {count} 项</span>
      <div className="ml-2 flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={onCut} className="h-7 text-xs gap-1.5">
          <Scissors className="size-3.5" />剪切
        </Button>
        <Button size="sm" variant="ghost" onClick={onCopy} className="h-7 text-xs gap-1.5">
          <Copy className="size-3.5" />复制
        </Button>
        <Button size="sm" variant="ghost" onClick={onDownload} className="h-7 text-xs gap-1.5">
          <Download className="size-3.5" />下载
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete} className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive">
          <Trash2 className="size-3.5" />删除
        </Button>
      </div>
      <button onClick={onClear} className="ml-auto text-muted-foreground hover:text-foreground">
        <X className="size-4" />
      </button>
    </div>
  )
}

// ===================== 状态栏 =====================
function StatusBar({ totalItems, selectedCount, currentPath }) {
  return (
    <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground shrink-0">
      <div className="flex gap-4">
        <span>共 {totalItems} 个项目</span>
        {selectedCount > 0 && <span className="text-primary font-medium">已选 {selectedCount} 项</span>}
      </div>
      <span className="font-mono truncate max-w-xs">{currentPath}</span>
    </div>
  )
}

// ===================== 主组件 =====================
export default function FileManager() {
  const currentServer = useServerStore(state => state.currentServer)
  const [currentPath, setCurrentPath] = useState('/')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [viewMode, setViewMode] = useState('details')
  const [sortField, setSortField] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [searchQuery, setSearchQuery] = useState('')
  const [showHidden, setShowHidden] = useState(false)
  const [history, setHistory] = useState(['/'])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [clipboard, setClipboard] = useState(null) // { names: [], operation: 'cut'|'copy' }
  const [isDragActive, setIsDragActive] = useState(false)
  const dragCounter = useRef(0)

  // Dialogs
  const [contextMenu, setContextMenu] = useState(null)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)

  // Fetch files
  const fetchFiles = useCallback(async (path) => {
    if (!currentServer) return
    setLoading(true)
    setFiles([])
    setSelectedItems(new Set())
    setSearchQuery('')
    try {
      const res = await api.get(`/api/files/${currentServer.id}/list`, { params: { path } })
      const data = res.data?.files ?? (Array.isArray(res.data) ? res.data : [])
      setFiles(data)
      setCurrentPath(path)
    } catch (err) {
      console.error('Failed to list files', err)
      alert('无法访问该目录: ' + (err.response?.data?.detail || err.message))
    } finally {
      setLoading(false)
    }
  }, [currentServer])

  useEffect(() => {
    if (currentServer) fetchFiles('/')
  }, [currentServer, fetchFiles])

  // Navigation
  const navigateTo = useCallback((path) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(path)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    fetchFiles(path)
  }, [history, historyIndex, fetchFiles])

  const canGoBack = historyIndex > 0
  const canGoForward = historyIndex < history.length - 1

  const goBack = useCallback(() => {
    if (canGoBack) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      fetchFiles(history[newIndex])
    }
  }, [canGoBack, historyIndex, history, fetchFiles])

  const goForward = useCallback(() => {
    if (canGoForward) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      fetchFiles(history[newIndex])
    }
  }, [canGoForward, historyIndex, history, fetchFiles])

  const goUp = useCallback(() => {
    if (currentPath === '/') return
    const parent = currentPath.split('/').slice(0, -1).join('/') || '/'
    navigateTo(parent)
  }, [currentPath, navigateTo])

  // Processed files (filter + sort)
  const processedFiles = useMemo(() => {
    let result = [...files]
    if (!showHidden) result = result.filter(f => !f.name.startsWith('.'))
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(f => f.name.toLowerCase().includes(q))
    }
    result.sort((a, b) => {
      if (a.is_dir && !b.is_dir) return -1
      if (!a.is_dir && b.is_dir) return 1
      let cmp = 0
      if (sortField === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortField === 'size') cmp = (a.size || 0) - (b.size || 0)
      else if (sortField === 'modified') cmp = (a.modified || '').localeCompare(b.modified || '')
      return sortDirection === 'asc' ? cmp : -cmp
    })
    return result
  }, [files, showHidden, searchQuery, sortField, sortDirection])

  // Selection
  const handleSelect = useCallback((name, multi = false, shift = false) => {
    if (name === null) { setSelectedItems(new Set()); return }
    if (name === '__all__') { setSelectedItems(new Set(processedFiles.map(f => f.name))); return }
    if (multi) {
      setSelectedItems(prev => {
        const next = new Set(prev)
        if (next.has(name)) next.delete(name)
        else next.add(name)
        return next
      })
    } else {
      setSelectedItems(new Set([name]))
    }
  }, [processedFiles])

  const handleSelectAll = useCallback(() => setSelectedItems(new Set(processedFiles.map(f => f.name))), [processedFiles])
  const handleInvertSelection = useCallback(() => {
    const inverted = new Set()
    processedFiles.forEach(f => { if (!selectedItems.has(f.name)) inverted.add(f.name) })
    setSelectedItems(inverted)
  }, [processedFiles, selectedItems])
  const handleClearSelection = useCallback(() => setSelectedItems(new Set()), [])

  // Open
  const handleOpen = useCallback((file) => {
    if (file.is_dir) {
      const newPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`
      navigateTo(newPath)
    }
  }, [currentPath, navigateTo])

  // Sort
  const handleSort = useCallback((field) => {
    if (field === sortField) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDirection('asc') }
  }, [sortField])

  // Clipboard
  const handleCut = useCallback(() => {
    if (selectedItems.size > 0) setClipboard({ names: Array.from(selectedItems), operation: 'cut' })
  }, [selectedItems])

  const handleCopy = useCallback(() => {
    if (selectedItems.size > 0) setClipboard({ names: Array.from(selectedItems), operation: 'copy' })
  }, [selectedItems])

  const handlePaste = useCallback(() => {
    if (clipboard) {
      alert(`粘贴功能需要后端支持文件复制/移动 API`)
    }
  }, [clipboard])

  // Delete
  const handleDelete = useCallback(async () => {
    if (selectedItems.size === 0) return
    setDeleteOpen(true)
  }, [selectedItems])

  const handleDeleteConfirm = useCallback(async () => {
    try {
      for (const name of selectedItems) {
        const filePath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`
        await api.delete(`/api/files/${currentServer.id}/delete`, { params: { path: filePath } })
      }
      fetchFiles(currentPath)
      setSelectedItems(new Set())
    } catch (err) {
      alert('删除失败: ' + (err.response?.data?.detail || err.message))
    }
  }, [selectedItems, currentPath, currentServer, fetchFiles])

  // Rename
  const handleRename = useCallback(() => {
    if (selectedItems.size === 1) {
      const name = Array.from(selectedItems)[0]
      const file = files.find(f => f.name === name)
      if (file) { setRenameTarget(file); setRenameOpen(true) }
    }
  }, [selectedItems, files])

  const handleRenameConfirm = useCallback(async (newName) => {
    if (!renameTarget) return
    try {
      const oldPath = currentPath === '/' ? `/${renameTarget.name}` : `${currentPath}/${renameTarget.name}`
      const newPath = currentPath === '/' ? `/${newName}` : `${currentPath}/${newName}`
      await api.post(`/api/files/${currentServer.id}/rename`, { old_path: oldPath, new_path: newPath })
      fetchFiles(currentPath)
    } catch (err) {
      alert('重命名失败: ' + (err.response?.data?.detail || err.message))
    }
  }, [renameTarget, currentPath, currentServer, fetchFiles])

  // New folder
  const handleNewFolder = useCallback(async (name) => {
    try {
      const folderPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`
      await api.post(`/api/files/${currentServer.id}/mkdir`, { path: folderPath })
      fetchFiles(currentPath)
    } catch (err) {
      alert('创建文件夹失败: ' + (err.response?.data?.detail || err.message))
    }
  }, [currentPath, currentServer, fetchFiles])

  // Upload
  const handleUpload = useCallback(async (fileList) => {
    if (!fileList.length) return
    try {
      for (const file of fileList) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('path', currentPath)
        await api.post(`/api/files/${currentServer.id}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }
      fetchFiles(currentPath)
    } catch (err) {
      alert('上传失败: ' + (err.response?.data?.detail || err.message))
    }
  }, [currentPath, currentServer, fetchFiles])

  // Download
  const handleDownload = useCallback(async (file) => {
    if (!file || file.is_dir) return
    try {
      const filePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`
      const res = await api.get(`/api/files/${currentServer.id}/download`, {
        params: { path: filePath }, responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url; a.download = file.name
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
    } catch (err) {
      alert('下载失败')
    }
  }, [currentPath, currentServer])

  const handleDownloadSelected = useCallback(() => {
    if (selectedItems.size === 1) {
      const name = Array.from(selectedItems)[0]
      const file = files.find(f => f.name === name)
      if (file) handleDownload(file)
    } else {
      alert('批量下载需要后端支持打包 API')
    }
  }, [selectedItems, files, handleDownload])

  // Drag and drop for upload
  const handleDragEnter = e => {
    e.preventDefault(); dragCounter.current++
    if (e.dataTransfer.items?.length > 0) setIsDragActive(true)
  }
  const handleDragLeave = e => {
    e.preventDefault(); dragCounter.current--
    if (dragCounter.current <= 0) { setIsDragActive(false); dragCounter.current = 0 }
  }
  const handleDragOver = e => e.preventDefault()
  const handleDrop = e => {
    e.preventDefault(); setIsDragActive(false); dragCounter.current = 0
    if (e.dataTransfer.files?.length > 0) handleUpload(Array.from(e.dataTransfer.files))
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = e => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && e.key === 'c') { e.preventDefault(); handleCopy() }
      else if (ctrl && e.key === 'x') { e.preventDefault(); handleCut() }
      else if (ctrl && e.key === 'v') { e.preventDefault(); handlePaste() }
      else if (ctrl && e.shiftKey && e.key === 'N') { e.preventDefault(); setNewFolderOpen(true) }
      else if (e.key === 'Delete') { e.preventDefault(); handleDelete() }
      else if (e.key === 'F2') { e.preventDefault(); handleRename() }
      else if (e.key === 'F5') { e.preventDefault(); fetchFiles(currentPath) }
      else if (ctrl && e.key === 'a') { e.preventDefault(); handleSelectAll() }
      else if (e.key === 'Escape') { handleClearSelection(); setContextMenu(null) }
      else if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); goBack() }
      else if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); goForward() }
      else if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); goUp() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleCopy, handleCut, handlePaste, handleDelete, handleRename, handleSelectAll, handleClearSelection, fetchFiles, currentPath, goBack, goForward, goUp])

  // No server selected
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

  const selectedNames = Array.from(selectedItems)

  return (
    <div
      className="flex h-[calc(100vh-100px)] flex-col relative overflow-hidden rounded-lg border border-border bg-background"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 拖拽上传遮罩 */}
      {isDragActive && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm border-2 border-dashed border-primary m-2 rounded-xl pointer-events-none">
          <div className="bg-primary/10 p-8 rounded-full mb-6 ring-8 ring-primary/5">
            <Upload className="w-20 h-20 text-primary animate-bounce" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">拖拽文件到此处上传</h2>
          <p className="text-muted-foreground mt-2 text-lg">松开鼠标即可开始上传</p>
        </div>
      )}

      {/* 工具栏 */}
      <Toolbar
        currentPath={currentPath}
        viewMode={viewMode}
        showHidden={showHidden}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        hasSelection={selectedItems.size > 0}
        hasClipboard={!!clipboard}
        searchQuery={searchQuery}
        loading={loading}
        onBack={goBack}
        onForward={goForward}
        onUp={goUp}
        onRefresh={() => fetchFiles(currentPath)}
        onViewModeChange={setViewMode}
        onToggleHidden={() => setShowHidden(v => !v)}
        onNewFolder={() => setNewFolderOpen(true)}
        onUpload={() => setUploadOpen(true)}
        onDownload={handleDownloadSelected}
        onCut={handleCut}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onDelete={handleDelete}
        onRename={handleRename}
        onSearchChange={setSearchQuery}
        onPathChange={navigateTo}
        onSelectAll={handleSelectAll}
        onInvertSelection={handleInvertSelection}
        onClearSelection={handleClearSelection}
        selectedCount={selectedItems.size}
        totalCount={processedFiles.length}
      />

      {/* 主内容区 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏 */}
        <Sidebar currentPath={currentPath} onNavigate={navigateTo} server={currentServer} />

        {/* 文件内容 */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* 加载/空状态 */}
          {loading && (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <RefreshCw className="size-8 animate-spin text-primary" />
                <span className="text-sm">加载中...</span>
              </div>
            </div>
          )}
          {!loading && processedFiles.length === 0 && (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Folder className="size-12 opacity-20" />
                <span className="text-sm">{searchQuery ? '未找到匹配的文件' : '此目录为空'}</span>
              </div>
            </div>
          )}
          {!loading && processedFiles.length > 0 && (
            <>
              {viewMode === 'grid' && (
                <GridView
                  files={processedFiles}
                  selectedItems={selectedItems}
                  onSelect={handleSelect}
                  onOpen={handleOpen}
                  onContextMenu={(e, file) => setContextMenu({ x: Math.min(e.clientX, window.innerWidth - 200), y: Math.min(e.clientY, window.innerHeight - 350), file: file || null })}
                />
              )}
              {viewMode === 'list' && (
                <ListView
                  files={processedFiles}
                  selectedItems={selectedItems}
                  onSelect={handleSelect}
                  onOpen={handleOpen}
                  onContextMenu={(e, file) => setContextMenu({ x: Math.min(e.clientX, window.innerWidth - 200), y: Math.min(e.clientY, window.innerHeight - 350), file: file || null })}
                />
              )}
              {viewMode === 'details' && (
                <DetailsView
                  files={processedFiles}
                  selectedItems={selectedItems}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  onSelect={handleSelect}
                  onOpen={handleOpen}
                  onContextMenu={(e, file) => setContextMenu({ x: Math.min(e.clientX, window.innerWidth - 200), y: Math.min(e.clientY, window.innerHeight - 350), file: file || null })}
                  onSort={handleSort}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* 多选操作栏 */}
      {selectedItems.size > 1 && (
        <SelectionBar
          count={selectedItems.size}
          onCut={handleCut}
          onCopy={handleCopy}
          onDelete={handleDelete}
          onDownload={handleDownloadSelected}
          onClear={handleClearSelection}
        />
      )}

      {/* 状态栏 */}
      <StatusBar totalItems={processedFiles.length} selectedCount={selectedItems.size} currentPath={currentPath} />

      {/* 右键菜单 */}
      <ContextMenu
        state={contextMenu}
        onClose={() => setContextMenu(null)}
        onOpen={file => handleOpen(file)}
        onCut={handleCut}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onDelete={handleDelete}
        onRename={handleRename}
        onNewFolder={() => setNewFolderOpen(true)}
        onUpload={() => setUploadOpen(true)}
        onDownload={file => handleDownload(file)}
        onRefresh={() => fetchFiles(currentPath)}
        hasClipboard={!!clipboard}
        hasSelection={selectedItems.size > 0}
      />

      {/* 对话框 */}
      <NewFolderDialog open={newFolderOpen} onClose={() => setNewFolderOpen(false)} onCreate={handleNewFolder} />
      <RenameDialog open={renameOpen} onClose={() => { setRenameOpen(false); setRenameTarget(null) }} file={renameTarget} onRename={handleRenameConfirm} />
      <DeleteDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} files={selectedNames} onConfirm={handleDeleteConfirm} />
      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={handleUpload} currentPath={currentPath} />
    </div>
  )
}
