"use client"

import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RefreshCw,
  Search,
  FolderPlus,
  Upload,
  Download,
  Scissors,
  Copy,
  ClipboardPaste,
  Trash2,
  Edit3,
  LayoutGrid,
  List,
  Table2,
  Eye,
  EyeOff,
  MoreHorizontal,
  ChevronRight,
  Terminal,
  Info,
  CheckSquare,
  XSquare,
  ToggleRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import type { ViewMode } from "@/lib/file-manager-types"

interface ToolbarProps {
  currentPath: string
  viewMode: ViewMode
  showHidden: boolean
  canGoBack: boolean
  canGoForward: boolean
  hasSelection: boolean
  hasClipboard: boolean
  searchQuery: string
  onBack: () => void
  onForward: () => void
  onUp: () => void
  onRefresh: () => void
  onViewModeChange: (mode: ViewMode) => void
  onToggleHidden: () => void
  onNewFolder: () => void
  onUpload: () => void
  onDownload: () => void
  onCut: () => void
  onCopy: () => void
  onPaste: () => void
  onDelete: () => void
  onRename: () => void
  onSearchChange: (query: string) => void
  onPathChange: (path: string) => void
  onOpenTerminal: () => void
  onProperties: () => void
  onSelectAll: () => void
  onInvertSelection: () => void
  onClearSelection: () => void
  selectedCount: number
  totalCount: number
}

export function FileManagerToolbar({
  currentPath,
  viewMode,
  showHidden,
  canGoBack,
  canGoForward,
  hasSelection,
  hasClipboard,
  searchQuery,
  onBack,
  onForward,
  onUp,
  onRefresh,
  onViewModeChange,
  onToggleHidden,
  onNewFolder,
  onUpload,
  onDownload,
  onCut,
  onCopy,
  onPaste,
  onDelete,
  onRename,
  onSearchChange,
  onPathChange,
  onOpenTerminal,
  onProperties,
  onSelectAll,
  onInvertSelection,
  onClearSelection,
  selectedCount,
  totalCount,
}: ToolbarProps) {
  const pathSegments = currentPath.split("/").filter(Boolean)

  return (
    <div className="flex flex-col border-b border-border bg-toolbar">
      {/* Navigation Row */}
      <div className="flex items-center gap-1 px-2 py-1.5">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            icon={ArrowLeft}
            tooltip="Back (Alt+Left)"
            onClick={onBack}
            disabled={!canGoBack}
          />
          <ToolbarButton
            icon={ArrowRight}
            tooltip="Forward (Alt+Right)"
            onClick={onForward}
            disabled={!canGoForward}
          />
          <ToolbarButton
            icon={ArrowUp}
            tooltip="Up (Alt+Up)"
            onClick={onUp}
          />
          <ToolbarButton
            icon={RefreshCw}
            tooltip="Refresh (F5)"
            onClick={onRefresh}
          />
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Address Bar */}
        <div className="flex flex-1 items-center overflow-hidden rounded-md border border-input bg-background px-2 py-1">
          <div className="flex items-center gap-0.5 overflow-x-auto">
            <button
              onClick={() => onPathChange("/")}
              className="shrink-0 rounded px-1 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              /
            </button>
            {pathSegments.map((segment, index) => {
              const segmentPath = "/" + pathSegments.slice(0, index + 1).join("/")
              const isLast = index === pathSegments.length - 1
              return (
                <div key={segmentPath} className="flex shrink-0 items-center">
                  <ChevronRight className="size-3 text-muted-foreground" />
                  <button
                    onClick={() => onPathChange(segmentPath)}
                    className={cn(
                      "rounded px-1 py-0.5 text-xs transition-colors hover:bg-accent hover:text-accent-foreground",
                      isLast ? "font-medium text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {segment}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Search */}
        <div className="relative w-52">
          <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-7 w-full rounded-md border border-input bg-background pl-7 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Action Row */}
      <div className="flex items-center gap-0.5 border-t border-border/50 px-2 py-1">
        <ToolbarButton
          icon={FolderPlus}
          tooltip="New Folder (Ctrl+Shift+N)"
          onClick={onNewFolder}
          label="New Folder"
        />
        <ToolbarButton
          icon={Upload}
          tooltip="Upload (Ctrl+U)"
          onClick={onUpload}
          label="Upload"
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolbarButton
          icon={Scissors}
          tooltip="Cut (Ctrl+X)"
          onClick={onCut}
          disabled={!hasSelection}
        />
        <ToolbarButton
          icon={Copy}
          tooltip="Copy (Ctrl+C)"
          onClick={onCopy}
          disabled={!hasSelection}
        />
        <ToolbarButton
          icon={ClipboardPaste}
          tooltip="Paste (Ctrl+V)"
          onClick={onPaste}
          disabled={!hasClipboard}
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolbarButton
          icon={Edit3}
          tooltip="Rename (F2)"
          onClick={onRename}
          disabled={!hasSelection}
        />
        <ToolbarButton
          icon={Download}
          tooltip="Download"
          onClick={onDownload}
          disabled={!hasSelection}
        />
        <ToolbarButton
          icon={Trash2}
          tooltip="Delete (Delete)"
          onClick={onDelete}
          disabled={!hasSelection}
          variant="destructive"
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolbarButton
          icon={Terminal}
          tooltip="Open Terminal"
          onClick={onOpenTerminal}
        />
        <ToolbarButton
          icon={Info}
          tooltip="Properties"
          onClick={onProperties}
          disabled={!hasSelection}
        />

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Selection controls */}
        <ToolbarButton
          icon={CheckSquare}
          tooltip="Select All (Ctrl+A)"
          onClick={onSelectAll}
          label={selectedCount > 0 ? `${selectedCount}/${totalCount}` : undefined}
          active={selectedCount > 0 && selectedCount === totalCount}
        />
        <ToolbarButton
          icon={ToggleRight}
          tooltip="Invert Selection"
          onClick={onInvertSelection}
        />
        {selectedCount > 0 && (
          <ToolbarButton
            icon={XSquare}
            tooltip="Clear Selection (Esc)"
            onClick={onClearSelection}
          />
        )}

        <div className="ml-auto flex items-center gap-0.5">
          <ToolbarButton
            icon={showHidden ? EyeOff : Eye}
            tooltip={showHidden ? "Hide Hidden Files" : "Show Hidden Files"}
            onClick={onToggleHidden}
            active={showHidden}
          />

          <Separator orientation="vertical" className="mx-1 h-5" />

          <div className="flex items-center rounded-md border border-border">
            <ViewModeButton
              icon={LayoutGrid}
              active={viewMode === "grid"}
              onClick={() => onViewModeChange("grid")}
              tooltip="Grid View"
              position="left"
            />
            <ViewModeButton
              icon={List}
              active={viewMode === "list"}
              onClick={() => onViewModeChange("list")}
              tooltip="List View"
              position="middle"
            />
            <ViewModeButton
              icon={Table2}
              active={viewMode === "details"}
              onClick={() => onViewModeChange("details")}
              tooltip="Details View"
              position="right"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onNewFolder}>
                <FolderPlus className="mr-2 size-4" />
                New Folder
                <DropdownMenuShortcut>Ctrl+Shift+N</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onUpload}>
                <Upload className="mr-2 size-4" />
                Upload Files
                <DropdownMenuShortcut>Ctrl+U</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onToggleHidden}>
                {showHidden ? (
                  <EyeOff className="mr-2 size-4" />
                ) : (
                  <Eye className="mr-2 size-4" />
                )}
                {showHidden ? "Hide Hidden Files" : "Show Hidden Files"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onOpenTerminal}>
                <Terminal className="mr-2 size-4" />
                Open Terminal Here
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

interface ToolbarButtonProps {
  icon: React.ComponentType<{ className?: string }>
  tooltip: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
  label?: string
  variant?: "default" | "destructive"
}

function ToolbarButton({
  icon: Icon,
  tooltip,
  onClick,
  disabled,
  active,
  label,
  variant,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            "disabled:pointer-events-none disabled:opacity-40",
            active && "bg-accent text-accent-foreground",
            variant === "destructive" && "hover:bg-destructive/10 hover:text-destructive",
            !label && "px-1.5",
          )}
        >
          <Icon className="size-3.5" />
          {label && <span className="hidden md:inline">{label}</span>}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}

interface ViewModeButtonProps {
  icon: React.ComponentType<{ className?: string }>
  active: boolean
  onClick: () => void
  tooltip: string
  position: "left" | "middle" | "right"
}

function ViewModeButton({
  icon: Icon,
  active,
  onClick,
  tooltip,
  position,
}: ViewModeButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "inline-flex items-center justify-center px-2 py-1 transition-colors",
            active
              ? "bg-primary text-primary-foreground"
              : "text-toolbar-foreground hover:bg-accent hover:text-accent-foreground",
            position === "left" && "rounded-l-[5px]",
            position === "right" && "rounded-r-[5px]",
          )}
        >
          <Icon className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
}
