"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileIcon } from "./file-icon"
import { formatFileSize } from "@/lib/file-manager-types"
import type { FileItem } from "@/lib/file-manager-types"
import { Separator } from "@/components/ui/separator"

// ========== New Folder Dialog ==========
interface NewFolderDialogProps {
  open: boolean
  onClose: () => void
  onCreate: (name: string) => void
}

export function NewFolderDialog({ open, onClose, onCreate }: NewFolderDialogProps) {
  const [name, setName] = useState("New Folder")

  function handleCreate() {
    if (name.trim()) {
      onCreate(name.trim())
      setName("New Folder")
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>New Folder</DialogTitle>
          <DialogDescription>Enter a name for the new folder.</DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Label htmlFor="folder-name" className="text-sm font-medium">
            Folder Name
          </Label>
          <Input
            id="folder-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="mt-1.5"
            autoFocus
            onFocus={(e) => e.target.select()}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ========== Rename Dialog ==========
interface RenameDialogProps {
  open: boolean
  file: FileItem | null
  onClose: () => void
  onRename: (newName: string) => void
}

export function RenameDialog({ open, file, onClose, onRename }: RenameDialogProps) {
  const [name, setName] = useState(file?.name ?? "")

  function handleRename() {
    if (name.trim() && name !== file?.name) {
      onRename(name.trim())
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Rename</DialogTitle>
          <DialogDescription>
            Enter a new name for &ldquo;{file?.name}&rdquo;.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Label htmlFor="rename-input" className="text-sm font-medium">
            New Name
          </Label>
          <Input
            id="rename-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            className="mt-1.5"
            autoFocus
            onFocus={(e) => {
              // Select name without extension
              const dotIndex = file?.name.lastIndexOf(".")
              if (dotIndex && dotIndex > 0) {
                e.target.setSelectionRange(0, dotIndex)
              } else {
                e.target.select()
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleRename} disabled={!name.trim() || name === file?.name}>
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ========== Delete Confirm Dialog ==========
interface DeleteDialogProps {
  open: boolean
  files: FileItem[]
  onClose: () => void
  onConfirm: () => void
}

export function DeleteDialog({ open, files, onClose, onConfirm }: DeleteDialogProps) {
  const count = files.length
  const hasFolders = files.some((f) => f.type === "folder")

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogDescription>
            {count === 1 ? (
              <>
                Are you sure you want to delete &ldquo;{files[0]?.name}&rdquo;?
              </>
            ) : (
              <>
                Are you sure you want to delete {count} items?
              </>
            )}
            {hasFolders && (
              <span className="mt-1 block text-destructive">
                This will also delete all contents inside selected folders.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        {count <= 5 && (
          <div className="rounded-md border border-border bg-muted/30 p-2">
            {files.map((f) => (
              <div key={f.id} className="flex items-center gap-2 py-1">
                <FileIcon type={f.type} size="sm" />
                <span className="truncate text-sm text-foreground">{f.name}</span>
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => { onConfirm(); onClose() }}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ========== Properties Dialog ==========
interface PropertiesDialogProps {
  open: boolean
  file: FileItem | null
  onClose: () => void
}

export function PropertiesDialog({ open, file, onClose }: PropertiesDialogProps) {
  if (!file) return null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <FileIcon type={file.type} size="lg" />
            <div>
              <DialogTitle>{file.name}</DialogTitle>
              <DialogDescription>
                {file.type === "folder" ? "Folder" : file.extension?.toUpperCase() + " File"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
          <span className="text-muted-foreground">Location</span>
          <span className="font-mono text-xs text-foreground">{file.path}</span>

          <span className="text-muted-foreground">Size</span>
          <span className="text-foreground">
            {file.type === "folder" ? "--" : formatFileSize(file.size)}
            {file.size > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({file.size.toLocaleString()} bytes)
              </span>
            )}
          </span>

          <span className="text-muted-foreground">Type</span>
          <span className="capitalize text-foreground">{file.type}</span>
        </div>

        <Separator />

        <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
          <span className="text-muted-foreground">Created</span>
          <span className="text-foreground">
            {new Date(file.created).toLocaleString()}
          </span>

          <span className="text-muted-foreground">Modified</span>
          <span className="text-foreground">
            {new Date(file.modified).toLocaleString()}
          </span>
        </div>

        <Separator />

        <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
          <span className="text-muted-foreground">Permissions</span>
          <span className="font-mono text-foreground">{file.permissions}</span>

          <span className="text-muted-foreground">Owner</span>
          <span className="text-foreground">{file.owner}</span>

          <span className="text-muted-foreground">Group</span>
          <span className="text-foreground">{file.group}</span>

          {file.isHidden && (
            <>
              <span className="text-muted-foreground">Hidden</span>
              <span className="text-foreground">Yes</span>
            </>
          )}

          {file.isSymlink && (
            <>
              <span className="text-muted-foreground">Link Target</span>
              <span className="font-mono text-xs text-foreground">{file.linkTarget}</span>
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ========== Upload Dialog ==========
interface UploadDialogProps {
  open: boolean
  onClose: () => void
}

export function UploadDialog({ open, onClose }: UploadDialogProps) {
  const [isDragging, setIsDragging] = useState(false)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Drag and drop files here or click to browse.
          </DialogDescription>
        </DialogHeader>

        <div
          className={`flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false) }}
        >
          <svg
            className="mb-3 size-10 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm text-muted-foreground">
            Drop files here to upload
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            or click to browse from your computer
          </p>
          <Button variant="outline" size="sm" className="mt-3">
            Browse Files
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled>
            Upload (0 files)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ========== Terminal Dialog ==========
interface TerminalDialogProps {
  open: boolean
  currentPath: string
  onClose: () => void
}

export function TerminalDialog({ open, currentPath, onClose }: TerminalDialogProps) {
  const [input, setInput] = useState("")
  const [history, setHistory] = useState<string[]>([
    `root@cloud-server-01:${currentPath}$ `,
  ])

  function handleCommand() {
    if (!input.trim()) return
    const newHistory = [
      ...history,
      `root@cloud-server-01:${currentPath}$ ${input}`,
      `Command "${input}" would be sent to server...`,
      `root@cloud-server-01:${currentPath}$ `,
    ]
    setHistory(newHistory)
    setInput("")
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Terminal - {currentPath}</DialogTitle>
          <DialogDescription>
            Remote shell session to cloud-server-01
          </DialogDescription>
        </DialogHeader>

        <div className="h-[300px] overflow-y-auto rounded-md border border-border bg-foreground p-3 font-mono text-xs text-background">
          {history.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap">{line}</div>
          ))}
          <div className="flex">
            <span>root@cloud-server-01:{currentPath}$ </span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCommand()}
              className="flex-1 border-none bg-transparent text-background outline-none"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
