import { useRef } from 'react'
import { Camera as CameraIcon, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/presentation/components/ui'

interface CameraInputProps {
  onCapture: (file: File) => void
  acceptVideo?: boolean
}

export const CameraInput = ({ onCapture, acceptVideo = false }: CameraInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onCapture(file)
      // Reset input so the same file can be selected again
      e.target.value = ''
    }
  }

  const accept = acceptVideo ? 'image/*,video/*' : 'image/*'

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1"
        >
          <CameraIcon className="mr-2 h-4 w-4" />
          Take Photo
        </Button>

        {acceptVideo && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.accept = 'video/*'
                fileInputRef.current.click()
                // Reset to default after
                setTimeout(() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = accept
                  }
                }, 100)
              }
            }}
            className="flex-1"
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            Record Video
          </Button>
        )}
      </div>
    </div>
  )
}
