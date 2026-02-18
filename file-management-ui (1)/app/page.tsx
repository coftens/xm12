import { FileManager } from "@/components/file-manager/file-manager"
import { Toaster } from "sonner"

export default function Page() {
  return (
    <>
      <FileManager />
      <Toaster position="bottom-right" richColors />
    </>
  )
}
