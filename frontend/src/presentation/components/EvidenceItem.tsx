import { FileImage } from 'lucide-react'
import { useOPFSFile } from '@/presentation/hooks/useOPFSFile'
import type { Evidence } from '@/domain/entities'

interface EvidenceItemProps {
  evidence: Evidence
}

export const EvidenceItem = ({ evidence }: EvidenceItemProps) => {
  const dataURL = useOPFSFile(evidence.filePath)

  if (!dataURL) {
    return (
      <div className="relative rounded-lg border border-surface overflow-hidden bg-surface/50 p-4 text-center">
        <FileImage className="mx-auto h-8 w-8 text-muted-foreground mb-2 animate-pulse" />
        <p className="text-xs text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="relative rounded-lg border border-surface overflow-hidden">
      {evidence.type === 'image' ? (
        <img src={dataURL} alt="Evidence" className="h-32 w-full object-cover" />
      ) : (
        <video src={dataURL} className="h-32 w-full object-cover" controls />
      )}
      <div className="absolute bottom-1 right-1 rounded bg-black/50 p-1">
        <FileImage className="h-3 w-3 text-white" />
      </div>
    </div>
  )
}
