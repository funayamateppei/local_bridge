import { useState } from 'react'
import { CheckCircle, XCircle, HelpCircle, Trash2, type LucideIcon } from 'lucide-react'
import { Button, Textarea, CameraInput } from '@/presentation/components/ui'
import type { InspectionItem, Area, Equipment, InspectionVerdict } from '@/domain/types/inspection'
import { cn } from '@/lib/utils'

interface CapturedFile {
  file: File
  preview: string
  type: 'image' | 'video'
}

interface InspectionViewProps {
  task: InspectionItem
  area: Area
  equipment: Equipment
  onSubmit: (data: { verdict: InspectionVerdict; note: string; files: File[] }) => void
  isLoading: boolean
}

export const InspectionView = ({
  task,
  area,
  equipment,
  onSubmit,
  isLoading,
}: InspectionViewProps) => {
  const [verdict, setVerdict] = useState<InspectionVerdict | null>(null)
  const [note, setNote] = useState('')
  const [capturedFiles, setCapturedFiles] = useState<CapturedFile[]>([])

  const handleCapture = (file: File) => {
    const preview = URL.createObjectURL(file)
    const type = file.type.startsWith('video/') ? 'video' : 'image'
    setCapturedFiles([...capturedFiles, { file, preview, type }])
  }

  const handleRemoveFile = (index: number) => {
    const newFiles = [...capturedFiles]
    URL.revokeObjectURL(newFiles[index].preview)
    newFiles.splice(index, 1)
    setCapturedFiles(newFiles)
  }

  const handleSubmit = () => {
    if (!verdict) return
    onSubmit({
      verdict,
      note,
      files: capturedFiles.map((f) => f.file),
    })
  }

  const verdictOptions: Array<{
    value: InspectionVerdict
    label: string
    icon: LucideIcon
    color: string
  }> = [
    { value: 'ok', label: 'OK', icon: CheckCircle, color: 'bg-green-500' },
    { value: 'ng', label: 'NG', icon: XCircle, color: 'bg-red-500' },
    { value: 'n_a', label: 'N/A', icon: HelpCircle, color: 'bg-gray-500' },
  ]

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      {/* Task Header */}
      <div className="mb-6 rounded-xl border border-surface bg-surface/30 p-4 backdrop-blur-sm">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
            {area.name}
          </span>
          <span className="text-sm text-muted-foreground">→</span>
          <span className="rounded-full bg-secondary/10 px-2 py-1 text-xs font-semibold text-secondary">
            {equipment.name}
          </span>
        </div>
        <h2 className="mb-2 text-2xl font-bold">{task.title}</h2>
        {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
      </div>

      {/* Verdict Selection */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold">Inspection Result</h3>
        <div className="grid grid-cols-3 gap-3">
          {verdictOptions.map((option) => {
            const Icon = option.icon
            const isSelected = verdict === option.value
            return (
              <button
                key={option.value}
                onClick={() => setVerdict(option.value)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all',
                  isSelected
                    ? `${option.color} border-transparent text-white`
                    : 'border-surface bg-surface/30 text-foreground hover:border-primary'
                )}
              >
                <Icon className="h-8 w-8" />
                <span className="text-sm font-semibold">{option.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Photo/Video Capture */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold">Evidence</h3>
        <CameraInput onCapture={handleCapture} acceptVideo />

        {/* Preview */}
        {capturedFiles.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {capturedFiles.map((file, index) => (
              <div
                key={index}
                className="relative rounded-lg border border-surface overflow-hidden"
              >
                {file.type === 'image' ? (
                  <img
                    src={file.preview}
                    alt={`Evidence ${index + 1}`}
                    className="h-32 w-full object-cover"
                  />
                ) : (
                  <video src={file.preview} className="h-32 w-full object-cover" controls />
                )}
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold">Notes (Optional)</h3>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add any observations or comments..."
          rows={4}
        />
      </div>

      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-surface bg-background/80 p-4 backdrop-blur-md">
        <Button
          onClick={handleSubmit}
          disabled={!verdict || isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? 'Submitting...' : 'Submit Inspection'}
        </Button>
      </div>
    </div>
  )
}
