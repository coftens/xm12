"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import { FileIcon } from "./file-icon"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import type { FileItem, ViewMode, SortField, SortDirection } from "@/lib/file-manager-types"
import { formatFileSize } from "@/lib/file-manager-types"
import {
  ArrowUp,
  ArrowDown,
  Scissors,
  Copy,
  Trash2,
  Download,
  Archive,
  X,
  CheckSquare,
} from "lucide-react"

interface FileContentProps {
  files: FileItem[]
  viewMode: ViewMode
  selectedItems: Set<string>
  sortField: SortField
  sortDirection: SortDirection
  onSelect: (id: string, multi: boolean, shift?: boolean) => void
  onOpen: (item: FileItem) => void
  onContextMenu: (e: React.MouseEvent, item?: FileItem) => void
  onSort: (field: SortField) => void
  onSelectionChange: (items: Set<string>) => void
}

export function FileContent({
  files,
  viewMode,
  selectedItems,
  sortField,
  sortDirection,
  onSelect,
  onOpen,
  onContextMenu,
  onSort,
  onSelectionChange,
}: FileContentProps) {
  if (files.length === 0) {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        onContextMenu={(e) => {
          e.preventDefault()
          onContextMenu(e)
        }}
      >
        <div className="text-center">
          <p className="text-sm text-muted-foreground">This folder is empty</p>
        </div>
      </div>
    )
  }

  if (viewMode === "grid") {
    return (
      <GridView
        files={files}
        selectedItems={selectedItems}
        onSelect={onSelect}
        onOpen={onOpen}
        onContextMenu={onContextMenu}
        onSelectionChange={onSelectionChange}
      />
    )
  }

  if (viewMode === "list") {
    return (
      <ListView
        files={files}
        selectedItems={selectedItems}
        onSelect={onSelect}
        onOpen={onOpen}
        onContextMenu={onContextMenu}
        onSelectionChange={onSelectionChange}
      />
    )
  }

  return (
    <DetailsView
      files={files}
      selectedItems={selectedItems}
      sortField={sortField}
      sortDirection={sortDirection}
      onSelect={onSelect}
      onOpen={onOpen}
      onContextMenu={onContextMenu}
      onSort={onSort}
      onSelectionChange={onSelectionChange}
    />
  )
}

// ========== Rubber-Band Selection Hook ==========
interface RubberBandRect {
  x: number
  y: number
  width: number
  height: number
}

function useRubberBandSelection(
  containerRef: React.RefObject<HTMLElement | null>,
  files: FileItem[],
  selectedItems: Set<string>,
  onSelectionChange: (items: Set<string>) => void,
) {
  const [rubberBand, setRubberBand] = useState<RubberBandRect | null>(null)
  const startPoint = useRef<{ x: number; y: number } | null>(null)
  const isSelecting = useRef(false)
  const additive = useRef(false)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only on left click, and only on the container background (not on items)
      if (e.button !== 0) return
      const target = e.target as HTMLElement
      if (target.closest("[data-file-item]")) return

      e.preventDefault()
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      additive.current = e.ctrlKey || e.metaKey
      startPoint.current = {
        x: e.clientX - rect.left + (containerRef.current?.scrollLeft ?? 0),
        y: e.clientY - rect.top + (containerRef.current?.scrollTop ?? 0),
      }
      isSelecting.current = true

      // If not holding Ctrl, clear the selection immediately
      if (!additive.current) {
        onSelectionChange(new Set())
      }
    },
    [containerRef, onSelectionChange],
  )

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isSelecting.current || !startPoint.current || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const currentX = e.clientX - rect.left + containerRef.current.scrollLeft
      const currentY = e.clientY - rect.top + containerRef.current.scrollTop

      const x = Math.min(startPoint.current.x, currentX)
      const y = Math.min(startPoint.current.y, currentY)
      const width = Math.abs(currentX - startPoint.current.x)
      const height = Math.abs(currentY - startPoint.current.y)

      // Only show rubber band if dragged more than 5px
      if (width > 5 || height > 5) {
        setRubberBand({ x, y, width, height })

        // Find all items that intersect with the rubber band
        const bandRect = { left: x, top: y, right: x + width, bottom: y + height }
        const newSelection = additive.current ? new Set(selectedItems) : new Set<string>()

        const items = containerRef.current.querySelectorAll("[data-file-item]")
        items.forEach((el) => {
          const itemRect = el.getBoundingClientRect()
          const relRect = {
            left: itemRect.left - rect.left + containerRef.current!.scrollLeft,
            top: itemRect.top - rect.top + containerRef.current!.scrollTop,
            right: itemRect.right - rect.left + containerRef.current!.scrollLeft,
            bottom: itemRect.bottom - rect.top + containerRef.current!.scrollTop,
          }

          const intersects =
            relRect.left < bandRect.right &&
            relRect.right > bandRect.left &&
            relRect.top < bandRect.bottom &&
            relRect.bottom > bandRect.top

          const fileId = el.getAttribute("data-file-id")
          if (intersects && fileId) {
            newSelection.add(fileId)
          }
        })

        onSelectionChange(newSelection)
      }
    }

    function handleMouseUp() {
      isSelecting.current = false
      startPoint.current = null
      setRubberBand(null)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [containerRef, files, selectedItems, onSelectionChange])

  return { rubberBand, handleMouseDown }
}

// ========== Grid View ==========
interface ViewProps {
  files: FileItem[]
  selectedItems: Set<string>
  onSelect: (id: string, multi: boolean, shift?: boolean) => void
  onOpen: (item: FileItem) => void
  onContextMenu: (e: React.MouseEvent, item?: FileItem) => void
  onSelectionChange: (items: Set<string>) => void
}

function GridView({ files, selectedItems, onSelect, onOpen, onContextMenu, onSelectionChange }: ViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { rubberBand, handleMouseDown } = useRubberBandSelection(
    containerRef,
    files,
    selectedItems,
    onSelectionChange,
  )

  return (
    <ScrollArea className="flex-1">
      <div
        ref={containerRef}
        className="relative select-none p-3"
        onMouseDown={handleMouseDown}
        onContextMenu={(e) => {
          e.preventDefault()
          onContextMenu(e)
        }}
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-1">
          {files.map((file) => (
            <GridItem
              key={file.id}
              file={file}
              selected={selectedItems.has(file.id)}
              onSelect={onSelect}
              onOpen={onOpen}
              onContextMenu={onContextMenu}
              multiSelected={selectedItems.size > 0}
            />
          ))}
        </div>

        {/* Rubber band overlay */}
        {rubberBand && (
          <div
            className="pointer-events-none absolute border border-primary/60 bg-primary/10"
            style={{
              left: rubberBand.x,
              top: rubberBand.y,
              width: rubberBand.width,
              height: rubberBand.height,
            }}
          />
        )}
      </div>
    </ScrollArea>
  )
}

function GridItem({
  file,
  selected,
  onSelect,
  onOpen,
  onContextMenu,
  multiSelected,
}: {
  file: FileItem
  selected: boolean
  onSelect: (id: string, multi: boolean, shift?: boolean) => void
  onOpen: (item: FileItem) => void
  onContextMenu: (e: React.MouseEvent, item?: FileItem) => void
  multiSelected: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const showCheckbox = multiSelected || hovered || selected

  return (
    <div
      data-file-item
      data-file-id={file.id}
      className={cn(
        "group relative flex flex-col items-center gap-1 rounded-lg p-2 text-center transition-colors",
        "hover:bg-accent/60 cursor-pointer",
        selected && "bg-selection text-selection-foreground",
      )}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(file.id, e.ctrlKey || e.metaKey, e.shiftKey)
      }}
      onDoubleClick={() => onOpen(file)}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!selected) onSelect(file.id, false)
        onContextMenu(e, file)
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Checkbox */}
      <div
        className={cn(
          "absolute left-1 top-1 z-10 transition-opacity",
          showCheckbox ? "opacity-100" : "opacity-0",
        )}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(file.id, true)
        }}
      >
        <Checkbox
          checked={selected}
          className={cn(
            "size-4 rounded-sm border-muted-foreground/50",
            selected && "border-primary bg-primary text-primary-foreground",
          )}
          tabIndex={-1}
        />
      </div>

      <FileIcon type={file.type} size="lg" />
      <span
        className={cn(
          "w-full truncate text-[11px] leading-tight",
          selected ? "text-selection-foreground" : "text-foreground",
          file.isHidden && "opacity-60",
        )}
      >
        {file.name}
      </span>
    </div>
  )
}

// ========== List View ==========
function ListView({ files, selectedItems, onSelect, onOpen, onContextMenu, onSelectionChange }: ViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { rubberBand, handleMouseDown } = useRubberBandSelection(
    containerRef,
    files,
    selectedItems,
    onSelectionChange,
  )

  return (
    <ScrollArea className="flex-1">
      <div
        ref={containerRef}
        className="relative select-none p-1"
        onMouseDown={handleMouseDown}
        onContextMenu={(e) => {
          e.preventDefault()
          onContextMenu(e)
        }}
      >
        {files.map((file) => (
          <ListItem
            key={file.id}
            file={file}
            selected={selectedItems.has(file.id)}
            onSelect={onSelect}
            onOpen={onOpen}
            onContextMenu={onContextMenu}
            multiSelected={selectedItems.size > 0}
          />
        ))}

        {/* Rubber band overlay */}
        {rubberBand && (
          <div
            className="pointer-events-none absolute border border-primary/60 bg-primary/10"
            style={{
              left: rubberBand.x,
              top: rubberBand.y,
              width: rubberBand.width,
              height: rubberBand.height,
            }}
          />
        )}
      </div>
    </ScrollArea>
  )
}

function ListItem({
  file,
  selected,
  onSelect,
  onOpen,
  onContextMenu,
  multiSelected,
}: {
  file: FileItem
  selected: boolean
  onSelect: (id: string, multi: boolean, shift?: boolean) => void
  onOpen: (item: FileItem) => void
  onContextMenu: (e: React.MouseEvent, item?: FileItem) => void
  multiSelected: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const showCheckbox = multiSelected || hovered || selected

  return (
    <div
      data-file-item
      data-file-id={file.id}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-left transition-colors cursor-pointer",
        "hover:bg-accent/60",
        selected && "bg-selection text-selection-foreground",
      )}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(file.id, e.ctrlKey || e.metaKey, e.shiftKey)
      }}
      onDoubleClick={() => onOpen(file)}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!selected) onSelect(file.id, false)
        onContextMenu(e, file)
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Checkbox */}
      <div
        className={cn(
          "transition-all shrink-0",
          showCheckbox ? "w-5 opacity-100" : "w-0 opacity-0 overflow-hidden",
        )}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(file.id, true)
        }}
      >
        <Checkbox
          checked={selected}
          className={cn(
            "size-4 rounded-sm border-muted-foreground/50",
            selected && "border-primary bg-primary text-primary-foreground",
          )}
          tabIndex={-1}
        />
      </div>

      <FileIcon type={file.type} size="md" />
      <span
        className={cn(
          "flex-1 truncate text-sm",
          selected ? "text-selection-foreground" : "text-foreground",
          file.isHidden && "opacity-60",
        )}
      >
        {file.name}
      </span>
      <span
        className={cn(
          "w-20 shrink-0 text-right text-xs",
          selected ? "text-selection-foreground/70" : "text-muted-foreground",
        )}
      >
        {file.type === "folder" ? "--" : formatFileSize(file.size)}
      </span>
      <span
        className={cn(
          "w-32 shrink-0 text-right text-xs",
          selected ? "text-selection-foreground/70" : "text-muted-foreground",
        )}
      >
        {formatDate(file.modified)}
      </span>
    </div>
  )
}

// ========== Details View ==========
interface DetailsViewProps extends ViewProps {
  sortField: SortField
  sortDirection: SortDirection
  onSort: (field: SortField) => void
}

function DetailsView({
  files,
  selectedItems,
  sortField,
  sortDirection,
  onSelect,
  onOpen,
  onContextMenu,
  onSort,
  onSelectionChange,
}: DetailsViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { rubberBand, handleMouseDown } = useRubberBandSelection(
    containerRef,
    files,
    selectedItems,
    onSelectionChange,
  )
  const allSelected = files.length > 0 && selectedItems.size === files.length
  const someSelected = selectedItems.size > 0 && selectedItems.size < files.length

  return (
    <div
      className="flex flex-1 flex-col"
      onContextMenu={(e) => {
        e.preventDefault()
        onContextMenu(e)
      }}
    >
      {/* Header */}
      <div className="flex items-center border-b border-border bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground">
        {/* Select All Checkbox */}
        <div className="mr-2 flex w-5 shrink-0 items-center justify-center">
          <Checkbox
            checked={allSelected}
            className={cn(
              "size-4 rounded-sm border-muted-foreground/50",
              (allSelected || someSelected) && "border-primary bg-primary text-primary-foreground",
            )}
            onClick={() => {
              if (allSelected) {
                onSelectionChange(new Set())
              } else {
                onSelectionChange(new Set(files.map((f) => f.id)))
              }
            }}
            tabIndex={-1}
          />
        </div>

        <SortableHeader
          label="Name"
          field="name"
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={onSort}
          className="flex-1"
        />
        <SortableHeader
          label="Size"
          field="size"
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={onSort}
          className="w-24 text-right"
        />
        <SortableHeader
          label="Type"
          field="type"
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={onSort}
          className="w-28 text-right"
        />
        <SortableHeader
          label="Modified"
          field="modified"
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={onSort}
          className="w-40 text-right"
        />
        <span className="w-24 text-right">Permissions</span>
        <span className="w-20 text-right">Owner</span>
      </div>

      {/* Rows */}
      <ScrollArea className="flex-1">
        <div
          ref={containerRef}
          className="relative select-none py-0.5"
          onMouseDown={handleMouseDown}
        >
          {files.map((file, index) => (
            <DetailsRow
              key={file.id}
              file={file}
              selected={selectedItems.has(file.id)}
              onSelect={onSelect}
              onOpen={onOpen}
              onContextMenu={onContextMenu}
              even={index % 2 === 0}
              multiSelected={selectedItems.size > 0}
            />
          ))}

          {/* Rubber band overlay */}
          {rubberBand && (
            <div
              className="pointer-events-none absolute border border-primary/60 bg-primary/10"
              style={{
                left: rubberBand.x,
                top: rubberBand.y,
                width: rubberBand.width,
                height: rubberBand.height,
              }}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function SortableHeader({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
  className,
}: {
  label: string
  field: SortField
  sortField: SortField
  sortDirection: SortDirection
  onSort: (field: SortField) => void
  className?: string
}) {
  const isActive = sortField === field
  return (
    <button
      onClick={() => onSort(field)}
      className={cn(
        "flex items-center gap-1 transition-colors hover:text-foreground",
        className,
      )}
    >
      <span>{label}</span>
      {isActive && (
        sortDirection === "asc" ? (
          <ArrowUp className="size-3" />
        ) : (
          <ArrowDown className="size-3" />
        )
      )}
    </button>
  )
}

function DetailsRow({
  file,
  selected,
  onSelect,
  onOpen,
  onContextMenu,
  even,
  multiSelected,
}: {
  file: FileItem
  selected: boolean
  onSelect: (id: string, multi: boolean, shift?: boolean) => void
  onOpen: (item: FileItem) => void
  onContextMenu: (e: React.MouseEvent, item?: FileItem) => void
  even: boolean
  multiSelected: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const showCheckbox = multiSelected || hovered || selected

  return (
    <div
      data-file-item
      data-file-id={file.id}
      className={cn(
        "flex w-full items-center px-3 py-1 text-left text-[13px] transition-colors cursor-pointer",
        "hover:bg-accent/60",
        selected && "bg-selection text-selection-foreground",
        !selected && even && "bg-transparent",
        !selected && !even && "bg-muted/20",
      )}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(file.id, e.ctrlKey || e.metaKey, e.shiftKey)
      }}
      onDoubleClick={() => onOpen(file)}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!selected) onSelect(file.id, false)
        onContextMenu(e, file)
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Row Checkbox */}
      <div
        className={cn(
          "mr-2 flex w-5 shrink-0 items-center justify-center transition-opacity",
          showCheckbox ? "opacity-100" : "opacity-0",
        )}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(file.id, true)
        }}
      >
        <Checkbox
          checked={selected}
          className={cn(
            "size-4 rounded-sm border-muted-foreground/50",
            selected && "border-primary bg-primary text-primary-foreground",
          )}
          tabIndex={-1}
        />
      </div>

      <div className="flex flex-1 items-center gap-2">
        <FileIcon type={file.type} size="sm" />
        <span
          className={cn(
            "truncate",
            selected ? "text-selection-foreground" : "text-foreground",
            file.isHidden && "opacity-60",
          )}
        >
          {file.name}
        </span>
      </div>
      <span
        className={cn(
          "w-24 shrink-0 text-right text-xs",
          selected ? "text-selection-foreground/70" : "text-muted-foreground",
        )}
      >
        {file.type === "folder" ? "--" : formatFileSize(file.size)}
      </span>
      <span
        className={cn(
          "w-28 shrink-0 text-right text-xs capitalize",
          selected ? "text-selection-foreground/70" : "text-muted-foreground",
        )}
      >
        {file.type === "folder" ? "Folder" : file.extension?.toUpperCase() || file.type}
      </span>
      <span
        className={cn(
          "w-40 shrink-0 text-right text-xs",
          selected ? "text-selection-foreground/70" : "text-muted-foreground",
        )}
      >
        {formatDate(file.modified)}
      </span>
      <span
        className={cn(
          "w-24 shrink-0 text-right font-mono text-[11px]",
          selected ? "text-selection-foreground/70" : "text-muted-foreground",
        )}
      >
        {file.permissions}
      </span>
      <span
        className={cn(
          "w-20 shrink-0 text-right text-xs",
          selected ? "text-selection-foreground/70" : "text-muted-foreground",
        )}
      >
        {file.owner}
      </span>
    </div>
  )
}

// ========== Multi-Selection Action Bar ==========
interface SelectionActionBarProps {
  count: number
  onCut: () => void
  onCopy: () => void
  onDelete: () => void
  onDownload: () => void
  onCompress: () => void
  onClearSelection: () => void
}

export function SelectionActionBar({
  count,
  onCut,
  onCopy,
  onDelete,
  onDownload,
  onCompress,
  onClearSelection,
}: SelectionActionBarProps) {
  return (
    <div className="flex items-center gap-2 border-t border-primary/20 bg-primary/5 px-4 py-2">
      <CheckSquare className="size-4 text-primary" />
      <span className="text-sm font-medium text-foreground">
        {count} items selected
      </span>
      <div className="ml-4 flex items-center gap-1">
        <ActionButton icon={Scissors} label="Cut" onClick={onCut} />
        <ActionButton icon={Copy} label="Copy" onClick={onCopy} />
        <ActionButton icon={Download} label="Download" onClick={onDownload} />
        <ActionButton icon={Archive} label="Compress" onClick={onCompress} />
        <ActionButton icon={Trash2} label="Delete" onClick={onDelete} variant="destructive" />
      </div>
      <button
        onClick={onClearSelection}
        className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <X className="size-3.5" />
        Clear
      </button>
    </div>
  )
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  variant,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  variant?: "destructive"
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors",
        variant === "destructive"
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icon className="size-3.5" />
      <span>{label}</span>
    </button>
  )
}

// ========== Status Bar ==========
interface StatusBarProps {
  totalItems: number
  selectedCount: number
  selectedSize: number
  currentPath: string
}

export function StatusBar({ totalItems, selectedCount, selectedSize, currentPath }: StatusBarProps) {
  return (
    <div className="flex items-center justify-between border-t border-border bg-toolbar px-3 py-1 text-[11px] text-muted-foreground">
      <div className="flex items-center gap-3">
        <span>{totalItems} items</span>
        {selectedCount > 0 && (
          <>
            <span className="text-border">|</span>
            <span>
              {selectedCount} selected
              {selectedSize > 0 && ` (${formatFileSize(selectedSize)})`}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono">{currentPath}</span>
      </div>
    </div>
  )
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return `Today ${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
  }
  if (days === 1) {
    return `Yesterday ${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
  }
  if (days < 7) {
    return `${days} days ago`
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
