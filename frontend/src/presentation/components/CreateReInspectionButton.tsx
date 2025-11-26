import { useState, useEffect } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/presentation/components/ui'
import { useReInspection } from '@/presentation/hooks/useReInspection'

interface CreateReInspectionButtonProps {
  inspectionId: string
  disabled?: boolean
}

export const CreateReInspectionButton = ({
  inspectionId,
  disabled = false,
}: CreateReInspectionButtonProps) => {
  const { isCreating, error, createReInspection, getNGCount } = useReInspection()
  const [ngCount, setNgCount] = useState<number>(0)

  useEffect(() => {
    const loadNGCount = async () => {
      const count = await getNGCount(inspectionId)
      setNgCount(count)
    }
    loadNGCount()
  }, [inspectionId, getNGCount])

  const handleClick = () => {
    if (window.confirm(`${ngCount}件のNG項目から再検査を作成しますか？`)) {
      createReInspection(inspectionId)
    }
  }

  if (ngCount === 0) {
    return null // NG項目がない場合は表示しない
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleClick}
        disabled={disabled || isCreating}
        variant="outline"
        className="flex items-center gap-2 border-orange-500 text-orange-600 hover:bg-orange-50"
      >
        <RotateCcw className="h-4 w-4" />
        <span>{isCreating ? '作成中...' : `再検査を作成 (${ngCount}件)`}</span>
      </Button>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
