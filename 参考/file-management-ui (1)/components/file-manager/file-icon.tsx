"use client"

import {
  Folder,
  File,
  Image,
  Video,
  Music,
  FileText,
  Archive,
  Code,
  FileSpreadsheet,
  FileType2,
  Link,
  Terminal,
  HardDrive,
  Home,
  Monitor,
  Download,
  Server,
  Globe,
  Star,
  ChevronRight,
} from "lucide-react"
import type { FileType } from "@/lib/file-manager-types"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  folder: Folder,
  file: File,
  image: Image,
  video: Video,
  audio: Music,
  document: FileText,
  archive: Archive,
  code: Code,
  text: FileText,
  pdf: FileType2,
  spreadsheet: FileSpreadsheet,
  executable: Terminal,
  symlink: Link,
}

const colorMap: Record<FileType, string> = {
  folder: "text-primary",
  file: "text-muted-foreground",
  image: "text-emerald-500",
  video: "text-rose-500",
  audio: "text-amber-500",
  document: "text-primary",
  archive: "text-orange-500",
  code: "text-cyan-500",
  text: "text-muted-foreground",
  pdf: "text-red-500",
  spreadsheet: "text-green-600",
  executable: "text-muted-foreground",
  symlink: "text-primary",
}

interface FileIconProps {
  type: FileType
  className?: string
  size?: "sm" | "md" | "lg"
}

export function FileIcon({ type, className, size = "md" }: FileIconProps) {
  const Icon = iconMap[type] || File
  const color = colorMap[type] || "text-muted-foreground"
  const sizeClass = size === "sm" ? "size-4" : size === "lg" ? "size-12" : "size-5"

  return <Icon className={`${sizeClass} ${color} ${className ?? ""}`} />
}

const navIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  star: Star,
  home: Home,
  monitor: Monitor,
  "file-text": FileText,
  download: Download,
  image: Image,
  music: Music,
  video: Video,
  server: Server,
  "hard-drive": HardDrive,
  folder: Folder,
  globe: Globe,
  "chevron-right": ChevronRight,
}

interface NavIconProps {
  icon: string
  className?: string
}

export function NavIcon({ icon, className }: NavIconProps) {
  const Icon = navIconMap[icon] || Folder
  return <Icon className={`size-4 ${className ?? ""}`} />
}
