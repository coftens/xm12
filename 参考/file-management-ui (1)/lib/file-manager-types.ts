export type FileType =
  | "folder"
  | "file"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "archive"
  | "code"
  | "text"
  | "pdf"
  | "spreadsheet"
  | "executable"
  | "symlink"

export type ViewMode = "grid" | "list" | "details"

export type SortField = "name" | "size" | "modified" | "type"

export type SortDirection = "asc" | "desc"

export interface FileItem {
  id: string
  name: string
  type: FileType
  size: number // bytes
  modified: string // ISO date
  created: string // ISO date
  permissions: string // e.g. "rwxr-xr-x"
  owner: string
  group: string
  path: string
  extension?: string
  isHidden?: boolean
  isSymlink?: boolean
  linkTarget?: string
  children?: FileItem[]
}

export interface NavigationItem {
  id: string
  name: string
  path: string
  icon: string
  children?: NavigationItem[]
  isExpanded?: boolean
}

export interface ClipboardItem {
  items: FileItem[]
  operation: "copy" | "cut"
}

export interface FileManagerState {
  currentPath: string
  viewMode: ViewMode
  sortField: SortField
  sortDirection: SortDirection
  selectedItems: Set<string>
  clipboard: ClipboardItem | null
  history: string[]
  historyIndex: number
  searchQuery: string
  showHidden: boolean
  sidebarWidth: number
  detailsPanelOpen: boolean
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

export function getFileExtension(filename: string): string {
  const parts = filename.split(".")
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ""
}

export function getFileTypeFromExtension(ext: string): FileType {
  const imageExts = ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "ico"]
  const videoExts = ["mp4", "mkv", "avi", "mov", "wmv", "flv", "webm"]
  const audioExts = ["mp3", "wav", "ogg", "flac", "aac", "wma"]
  const docExts = ["doc", "docx", "odt", "rtf"]
  const archiveExts = ["zip", "tar", "gz", "rar", "7z", "bz2", "xz"]
  const codeExts = [
    "js", "ts", "tsx", "jsx", "py", "java", "c", "cpp", "h",
    "go", "rs", "rb", "php", "css", "scss", "html", "xml",
    "json", "yaml", "yml", "toml", "sql", "sh", "bash",
  ]
  const spreadsheetExts = ["xls", "xlsx", "csv", "ods"]

  if (imageExts.includes(ext)) return "image"
  if (videoExts.includes(ext)) return "video"
  if (audioExts.includes(ext)) return "audio"
  if (docExts.includes(ext)) return "document"
  if (archiveExts.includes(ext)) return "archive"
  if (codeExts.includes(ext)) return "code"
  if (spreadsheetExts.includes(ext)) return "spreadsheet"
  if (ext === "pdf") return "pdf"
  if (ext === "txt" || ext === "md" || ext === "log") return "text"
  if (ext === "exe" || ext === "bin" || ext === "app") return "executable"
  return "file"
}
