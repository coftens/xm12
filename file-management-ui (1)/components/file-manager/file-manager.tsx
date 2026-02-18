"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { FileManagerSidebar } from "./sidebar"
import { FileManagerToolbar } from "./toolbar"
import { FileContent, StatusBar, SelectionActionBar } from "./file-content"
import { FileContextMenu } from "./context-menu"
import {
  NewFolderDialog,
  RenameDialog,
  DeleteDialog,
  PropertiesDialog,
  UploadDialog,
  TerminalDialog,
} from "./dialogs"
import { sidebarNavigation, getFilesForPath } from "@/lib/mock-data"
import type {
  FileItem,
  ViewMode,
  SortField,
  SortDirection,
  ClipboardItem,
} from "@/lib/file-manager-types"
import { toast } from "sonner"

interface ContextMenuState {
  x: number
  y: number
  file: FileItem | null
}

export function FileManager() {
  // Core state
  const [currentPath, setCurrentPath] = useState("/home/user")
  const [viewMode, setViewMode] = useState<ViewMode>("details")
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null)
  const [history, setHistory] = useState<string[]>(["/home/user"])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [showHidden, setShowHidden] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Dialog state
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [propertiesOpen, setPropertiesOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [terminalOpen, setTerminalOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null)

  // Track last selected for Shift+Click range selection
  const lastSelectedId = useRef<string | null>(null)

  // File data
  const [files, setFiles] = useState<FileItem[]>(() => getFilesForPath("/home/user"))

  // Navigate to a path
  const navigateTo = useCallback(
    (path: string) => {
      setCurrentPath(path)
      setFiles(getFilesForPath(path))
      setSelectedItems(new Set())
      setSearchQuery("")

      // Update history
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(path)
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
    },
    [history, historyIndex],
  )

  // Filtered and sorted files
  const processedFiles = useMemo(() => {
    let result = [...files]

    // Filter hidden
    if (!showHidden) {
      result = result.filter((f) => !f.isHidden)
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((f) => f.name.toLowerCase().includes(q))
    }

    // Sort: folders first, then by field
    result.sort((a, b) => {
      // Folders always first
      if (a.type === "folder" && b.type !== "folder") return -1
      if (a.type !== "folder" && b.type === "folder") return 1

      let cmp = 0
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name)
          break
        case "size":
          cmp = a.size - b.size
          break
        case "modified":
          cmp = new Date(a.modified).getTime() - new Date(b.modified).getTime()
          break
        case "type":
          cmp = a.type.localeCompare(b.type)
          break
      }

      return sortDirection === "asc" ? cmp : -cmp
    })

    return result
  }, [files, showHidden, searchQuery, sortField, sortDirection])

  // Selection logic: Windows-style multi-select
  // - Click: select only this item
  // - Ctrl/Cmd+Click: toggle this item in selection
  // - Shift+Click: range select from last selected to this item
  const handleSelect = useCallback(
    (id: string, multi: boolean, shift?: boolean) => {
      if (shift && lastSelectedId.current) {
        // Shift+Click: range select
        const ids = processedFiles.map((f) => f.id)
        const startIdx = ids.indexOf(lastSelectedId.current)
        const endIdx = ids.indexOf(id)
        if (startIdx !== -1 && endIdx !== -1) {
          const rangeStart = Math.min(startIdx, endIdx)
          const rangeEnd = Math.max(startIdx, endIdx)
          const rangeIds = ids.slice(rangeStart, rangeEnd + 1)
          if (multi) {
            // Shift+Ctrl: add range to existing selection
            const next = new Set(selectedItems)
            rangeIds.forEach((rid) => next.add(rid))
            setSelectedItems(next)
          } else {
            // Shift only: replace selection with range
            setSelectedItems(new Set(rangeIds))
          }
        }
        // Don't update lastSelectedId on shift-click to allow extending range
      } else if (multi) {
        // Ctrl+Click: toggle single item
        const next = new Set(selectedItems)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        setSelectedItems(next)
        lastSelectedId.current = id
      } else {
        // Normal click: select only this item
        setSelectedItems(new Set([id]))
        lastSelectedId.current = id
      }
    },
    [selectedItems, processedFiles],
  )

  // Select all
  const handleSelectAll = useCallback(() => {
    setSelectedItems(new Set(processedFiles.map((f) => f.id)))
  }, [processedFiles])

  // Invert selection
  const handleInvertSelection = useCallback(() => {
    const inverted = new Set<string>()
    processedFiles.forEach((f) => {
      if (!selectedItems.has(f.id)) {
        inverted.add(f.id)
      }
    })
    setSelectedItems(inverted)
  }, [processedFiles, selectedItems])

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedItems(new Set())
    lastSelectedId.current = null
  }, [])

  // Open file/folder
  const handleOpen = useCallback(
    (item: FileItem) => {
      if (item.type === "folder") {
        navigateTo(item.path)
      } else {
        toast.info(`Opening ${item.name}...`, {
          description: "File viewer would open here in a real implementation.",
        })
      }
    },
    [navigateTo],
  )

  // Navigation
  const canGoBack = historyIndex > 0
  const canGoForward = historyIndex < history.length - 1

  const goBack = useCallback(() => {
    if (canGoBack) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      const path = history[newIndex]
      setCurrentPath(path)
      setFiles(getFilesForPath(path))
      setSelectedItems(new Set())
    }
  }, [canGoBack, historyIndex, history])

  const goForward = useCallback(() => {
    if (canGoForward) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      const path = history[newIndex]
      setCurrentPath(path)
      setFiles(getFilesForPath(path))
      setSelectedItems(new Set())
    }
  }, [canGoForward, historyIndex, history])

  const goUp = useCallback(() => {
    const parts = currentPath.split("/").filter(Boolean)
    if (parts.length > 0) {
      parts.pop()
      const parentPath = parts.length === 0 ? "/" : "/" + parts.join("/")
      navigateTo(parentPath)
    }
  }, [currentPath, navigateTo])

  const refresh = useCallback(() => {
    setFiles(getFilesForPath(currentPath))
    toast.success("Refreshed")
  }, [currentPath])

  // Clipboard operations
  const handleCut = useCallback(() => {
    const items = files.filter((f) => selectedItems.has(f.id))
    if (items.length > 0) {
      setClipboard({ items, operation: "cut" })
      toast.info(`${items.length} item(s) cut to clipboard`)
    }
  }, [files, selectedItems])

  const handleCopy = useCallback(() => {
    const items = files.filter((f) => selectedItems.has(f.id))
    if (items.length > 0) {
      setClipboard({ items, operation: "copy" })
      toast.info(`${items.length} item(s) copied to clipboard`)
    }
  }, [files, selectedItems])

  const handlePaste = useCallback(() => {
    if (clipboard) {
      toast.success(
        `${clipboard.operation === "cut" ? "Moved" : "Copied"} ${clipboard.items.length} item(s)`,
      )
      if (clipboard.operation === "cut") {
        setClipboard(null)
      }
    }
  }, [clipboard])

  // Delete
  const handleDelete = useCallback(() => {
    const items = files.filter((f) => selectedItems.has(f.id))
    if (items.length > 0) {
      setDeleteOpen(true)
    }
  }, [files, selectedItems])

  const handleDeleteConfirm = useCallback(() => {
    setFiles((prev) => prev.filter((f) => !selectedItems.has(f.id)))
    toast.success(`${selectedItems.size} item(s) deleted`)
    setSelectedItems(new Set())
  }, [selectedItems])

  // Rename
  const handleRename = useCallback(() => {
    const ids = Array.from(selectedItems)
    if (ids.length === 1) {
      const file = files.find((f) => f.id === ids[0])
      if (file) {
        setRenameTarget(file)
        setRenameOpen(true)
      }
    }
  }, [files, selectedItems])

  const handleRenameConfirm = useCallback(
    (newName: string) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === renameTarget?.id ? { ...f, name: newName } : f)),
      )
      toast.success(`Renamed to "${newName}"`)
    },
    [renameTarget],
  )

  // New folder
  const handleNewFolder = useCallback(
    (name: string) => {
      const newFolder: FileItem = {
        id: `new-${Date.now()}`,
        name,
        type: "folder",
        size: 0,
        modified: new Date().toISOString(),
        created: new Date().toISOString(),
        permissions: "rwxr-xr-x",
        owner: "root",
        group: "root",
        path: `${currentPath}/${name}`,
      }
      setFiles((prev) => [newFolder, ...prev])
      toast.success(`Folder "${name}" created`)
    },
    [currentPath],
  )

  // Sort
  const handleSort = useCallback(
    (field: SortField) => {
      if (field === sortField) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
      } else {
        setSortField(field)
        setSortDirection("asc")
      }
    },
    [sortField],
  )

  // Properties
  const handleProperties = useCallback(() => {
    const ids = Array.from(selectedItems)
    if (ids.length === 1) {
      setPropertiesOpen(true)
    }
  }, [selectedItems])

  // Context menu
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, file?: FileItem) => {
      setContextMenu({
        x: Math.min(e.clientX, window.innerWidth - 220),
        y: Math.min(e.clientY, window.innerHeight - 400),
        file: file ?? null,
      })
    },
    [],
  )

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger shortcuts when typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      const ctrl = e.ctrlKey || e.metaKey

      if (ctrl && e.key === "c") {
        e.preventDefault()
        handleCopy()
      } else if (ctrl && e.key === "x") {
        e.preventDefault()
        handleCut()
      } else if (ctrl && e.key === "v") {
        e.preventDefault()
        handlePaste()
      } else if (ctrl && e.shiftKey && e.key === "N") {
        e.preventDefault()
        setNewFolderOpen(true)
      } else if (e.key === "Delete") {
        e.preventDefault()
        handleDelete()
      } else if (e.key === "F2") {
        e.preventDefault()
        handleRename()
      } else if (e.key === "F5") {
        e.preventDefault()
        refresh()
      } else if (ctrl && e.key === "a") {
        e.preventDefault()
        handleSelectAll()
      } else if (e.key === "Escape") {
        handleClearSelection()
        setContextMenu(null)
      } else if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault()
        goBack()
      } else if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault()
        goForward()
      } else if (e.altKey && e.key === "ArrowUp") {
        e.preventDefault()
        goUp()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    handleCopy,
    handleCut,
    handlePaste,
    handleDelete,
    handleRename,
    handleSelectAll,
    handleClearSelection,
    refresh,
    processedFiles,
    goBack,
    goForward,
    goUp,
  ])

  // Selected files data
  const selectedFiles = useMemo(
    () => files.filter((f) => selectedItems.has(f.id)),
    [files, selectedItems],
  )
  const selectedSize = useMemo(
    () => selectedFiles.reduce((sum, f) => sum + f.size, 0),
    [selectedFiles],
  )
  const propertiesTarget =
    selectedFiles.length === 1 ? selectedFiles[0] : null

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {!sidebarCollapsed && (
          <div className="w-56 shrink-0">
            <FileManagerSidebar
              navigation={sidebarNavigation}
              currentPath={currentPath}
              onNavigate={navigateTo}
            />
          </div>
        )}

        {/* Content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Toolbar */}
          <FileManagerToolbar
            currentPath={currentPath}
            viewMode={viewMode}
            showHidden={showHidden}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            hasSelection={selectedItems.size > 0}
            hasClipboard={!!clipboard}
            searchQuery={searchQuery}
            onBack={goBack}
            onForward={goForward}
            onUp={goUp}
            onRefresh={refresh}
            onViewModeChange={setViewMode}
            onToggleHidden={() => setShowHidden(!showHidden)}
            onNewFolder={() => setNewFolderOpen(true)}
            onUpload={() => setUploadOpen(true)}
            onDownload={() =>
              toast.info("Download started for selected files")
            }
            onCut={handleCut}
            onCopy={handleCopy}
            onPaste={handlePaste}
            onDelete={handleDelete}
            onRename={handleRename}
            onSearchChange={setSearchQuery}
            onPathChange={navigateTo}
            onOpenTerminal={() => setTerminalOpen(true)}
            onProperties={handleProperties}
            onSelectAll={handleSelectAll}
            onInvertSelection={handleInvertSelection}
            onClearSelection={handleClearSelection}
            selectedCount={selectedItems.size}
            totalCount={processedFiles.length}
          />

          {/* File content */}
          <FileContent
            files={processedFiles}
            viewMode={viewMode}
            selectedItems={selectedItems}
            sortField={sortField}
            sortDirection={sortDirection}
            onSelect={handleSelect}
            onOpen={handleOpen}
            onContextMenu={handleContextMenu}
            onSort={handleSort}
            onSelectionChange={setSelectedItems}
          />

          {/* Multi-select action bar */}
          {selectedItems.size > 1 && (
            <SelectionActionBar
              count={selectedItems.size}
              onCut={handleCut}
              onCopy={handleCopy}
              onDelete={handleDelete}
              onDownload={() => toast.info("Download started for selected files")}
              onCompress={() => toast.info("Compressing selected files...")}
              onClearSelection={handleClearSelection}
            />
          )}

          {/* Status bar */}
          <StatusBar
            totalItems={processedFiles.length}
            selectedCount={selectedItems.size}
            selectedSize={selectedSize}
            currentPath={currentPath}
          />
        </div>
      </div>

      {/* Context Menu */}
      <FileContextMenu
        state={contextMenu}
        hasClipboard={!!clipboard}
        showHidden={showHidden}
        viewMode={viewMode}
        onClose={() => setContextMenu(null)}
        onOpen={() => {
          if (contextMenu?.file) handleOpen(contextMenu.file)
        }}
        onOpenInNewTab={() => {}}
        onCut={handleCut}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onDelete={handleDelete}
        onRename={handleRename}
        onNewFolder={() => setNewFolderOpen(true)}
        onUpload={() => setUploadOpen(true)}
        onDownload={() =>
          toast.info("Download started for selected files")
        }
        onRefresh={refresh}
        onToggleHidden={() => setShowHidden(!showHidden)}
        onViewModeChange={setViewMode}
        onProperties={handleProperties}
        onOpenTerminal={() => setTerminalOpen(true)}
        onCompress={() => toast.info("Compressing selected files...")}
        onChangePermissions={() => toast.info("Permissions dialog would open here")}
      />

      {/* Dialogs */}
      <NewFolderDialog
        open={newFolderOpen}
        onClose={() => setNewFolderOpen(false)}
        onCreate={handleNewFolder}
      />
      <RenameDialog
        open={renameOpen}
        file={renameTarget}
        onClose={() => {
          setRenameOpen(false)
          setRenameTarget(null)
        }}
        onRename={handleRenameConfirm}
      />
      <DeleteDialog
        open={deleteOpen}
        files={selectedFiles}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
      <PropertiesDialog
        open={propertiesOpen}
        file={propertiesTarget}
        onClose={() => setPropertiesOpen(false)}
      />
      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />
      <TerminalDialog
        open={terminalOpen}
        currentPath={currentPath}
        onClose={() => setTerminalOpen(false)}
      />
    </div>
  )
}
