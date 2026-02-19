"use client"

import { useEffect, useRef } from "react"
import {
  FolderOpen,
  FolderPlus,
  Upload,
  Scissors,
  Copy,
  ClipboardPaste,
  Trash2,
  Edit3,
  Download,
  Terminal,
  Info,
  RefreshCw,
  Eye,
  EyeOff,
  LayoutGrid,
  List,
  Table2,
  FileText,
  Share2,
  Lock,
  Archive,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { FileItem, ViewMode } from "@/lib/file-manager-types"

interface ContextMenuState {
  x: number
  y: number
  file: FileItem | null
}

interface FileContextMenuProps {
  state: ContextMenuState | null
  hasClipboard: boolean
  showHidden: boolean
  viewMode: ViewMode
  onClose: () => void
  onOpen: () => void
  onOpenInNewTab: () => void
  onCut: () => void
  onCopy: () => void
  onPaste: () => void
  onDelete: () => void
  onRename: () => void
  onNewFolder: () => void
  onUpload: () => void
  onDownload: () => void
  onRefresh: () => void
  onToggleHidden: () => void
  onViewModeChange: (mode: ViewMode) => void
  onProperties: () => void
  onOpenTerminal: () => void
  onCompress: () => void
  onChangePermissions: () => void
}

export function FileContextMenu({
  state,
  hasClipboard,
  showHidden,
  viewMode,
  onClose,
  onOpen,
  onCut,
  onCopy,
  onPaste,
  onDelete,
  onRename,
  onNewFolder,
  onUpload,
  onDownload,
  onRefresh,
  onToggleHidden,
  onViewModeChange,
  onProperties,
  onOpenTerminal,
  onCompress,
  onChangePermissions,
}: FileContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!state) return

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [state, onClose])

  if (!state) return null

  const isFileMenu = state.file !== null
  const isFolder = state.file?.type === "folder"

  // Adjust position to keep menu on screen
  const menuStyle: React.CSSProperties = {
    position: "fixed",
    left: state.x,
    top: state.y,
    zIndex: 9999,
  }

  return (
    <div ref={menuRef} style={menuStyle}>
      <div className="min-w-[200px] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
        {isFileMenu ? (
          <>
            <MenuItem
              icon={FolderOpen}
              label={isFolder ? "Open" : "Open File"}
              shortcut="Enter"
              onClick={() => { onOpen(); onClose() }}
            />
            <MenuSeparator />
            <MenuItem
              icon={Scissors}
              label="Cut"
              shortcut="Ctrl+X"
              onClick={() => { onCut(); onClose() }}
            />
            <MenuItem
              icon={Copy}
              label="Copy"
              shortcut="Ctrl+C"
              onClick={() => { onCopy(); onClose() }}
            />
            {hasClipboard && (
              <MenuItem
                icon={ClipboardPaste}
                label="Paste"
                shortcut="Ctrl+V"
                onClick={() => { onPaste(); onClose() }}
              />
            )}
            <MenuSeparator />
            <MenuItem
              icon={Edit3}
              label="Rename"
              shortcut="F2"
              onClick={() => { onRename(); onClose() }}
            />
            <MenuItem
              icon={Download}
              label="Download"
              onClick={() => { onDownload(); onClose() }}
            />
            <MenuItem
              icon={Archive}
              label="Compress"
              onClick={() => { onCompress(); onClose() }}
            />
            <MenuItem
              icon={Share2}
              label="Share Link"
              onClick={onClose}
            />
            <MenuSeparator />
            <MenuItem
              icon={Lock}
              label="Permissions"
              onClick={() => { onChangePermissions(); onClose() }}
            />
            <MenuItem
              icon={Trash2}
              label="Delete"
              shortcut="Del"
              onClick={() => { onDelete(); onClose() }}
              variant="destructive"
            />
            <MenuSeparator />
            <MenuItem
              icon={Info}
              label="Properties"
              onClick={() => { onProperties(); onClose() }}
            />
          </>
        ) : (
          <>
            <MenuItem
              icon={FolderPlus}
              label="New Folder"
              shortcut="Ctrl+Shift+N"
              onClick={() => { onNewFolder(); onClose() }}
            />
            <MenuItem
              icon={FileText}
              label="New File"
              onClick={onClose}
            />
            <MenuItem
              icon={Upload}
              label="Upload"
              shortcut="Ctrl+U"
              onClick={() => { onUpload(); onClose() }}
            />
            <MenuSeparator />
            {hasClipboard && (
              <>
                <MenuItem
                  icon={ClipboardPaste}
                  label="Paste"
                  shortcut="Ctrl+V"
                  onClick={() => { onPaste(); onClose() }}
                />
                <MenuSeparator />
              </>
            )}
            <MenuItem
              icon={RefreshCw}
              label="Refresh"
              shortcut="F5"
              onClick={() => { onRefresh(); onClose() }}
            />
            <MenuSeparator />
            <div className="px-2 py-1 text-xs text-muted-foreground">View</div>
            <div className="flex items-center gap-1 px-2 py-1">
              <ViewButton
                icon={LayoutGrid}
                active={viewMode === "grid"}
                onClick={() => { onViewModeChange("grid"); onClose() }}
              />
              <ViewButton
                icon={List}
                active={viewMode === "list"}
                onClick={() => { onViewModeChange("list"); onClose() }}
              />
              <ViewButton
                icon={Table2}
                active={viewMode === "details"}
                onClick={() => { onViewModeChange("details"); onClose() }}
              />
            </div>
            <MenuSeparator />
            <MenuItem
              icon={showHidden ? EyeOff : Eye}
              label={showHidden ? "Hide Hidden Files" : "Show Hidden Files"}
              onClick={() => { onToggleHidden(); onClose() }}
            />
            <MenuItem
              icon={Terminal}
              label="Open Terminal Here"
              onClick={() => { onOpenTerminal(); onClose() }}
            />
          </>
        )}
      </div>
    </div>
  )
}

interface MenuItemProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  shortcut?: string
  onClick: () => void
  variant?: "default" | "destructive"
  disabled?: boolean
}

function MenuItem({
  icon: Icon,
  label,
  shortcut,
  onClick,
  variant,
  disabled,
}: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "disabled:pointer-events-none disabled:opacity-50",
        variant === "destructive" && "text-destructive hover:bg-destructive/10 hover:text-destructive",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      {shortcut && (
        <span className="ml-4 text-xs text-muted-foreground">{shortcut}</span>
      )}
    </button>
  )
}

function MenuSeparator() {
  return <div className="my-1 h-px bg-border" />
}

function ViewButton({
  icon: Icon,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-sm p-1.5 transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "hover:bg-accent text-muted-foreground hover:text-accent-foreground",
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}
