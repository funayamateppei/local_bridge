import { useParams } from 'react-router-dom'
import { useMobileTaskDetail, useMobileTaskSubmit } from '@/presentation/hooks/mobile'
import { InspectionView } from '@/presentation/features/mobile/Inspection/InspectionView'
import { useAuth } from '@/presentation/hooks/auth/useAuth'
import type { InspectionVerdict } from '@/domain/types/inspection'

export const Page = () => {
  const { taskId } = useParams<{ taskId: string }>()
  const { username } = useAuth()

  const { task, area, equipment, isLoading: isLoadingData, error } = useMobileTaskDetail(taskId)
  const { submitResult, isSubmitting } = useMobileTaskSubmit(taskId)

  const handleSubmit = async (data: {
    verdict: InspectionVerdict
    note: string
    files: File[]
  }) => {
    if (!username) return
    await submitResult(data, username)
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>
  }

  if (isLoadingData || !task || !area || !equipment) {
    return <div className="p-4 text-center">読み込み中...</div>
  }

  return (
    <InspectionView
      task={task}
      area={area}
      equipment={equipment}
      onSubmit={handleSubmit}
      isLoading={isSubmitting}
    />
  )
}
