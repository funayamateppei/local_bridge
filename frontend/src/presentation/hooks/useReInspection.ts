import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { reInspectionService } from '@/infrastructure/services/ReInspectionService'
import { Routing } from '@/presentation/routes/routing'

export const useReInspection = () => {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  /**
   * 再検査を作成
   */
  const createReInspection = async (inspectionId: string) => {
    setIsCreating(true)
    setError(null)

    try {
      // NG項目数をチェック
      const ngCount = await reInspectionService.countNGItems(inspectionId)
      if (ngCount === 0) {
        setError('再検査が必要な項目がありません')
        setIsCreating(false)
        return
      }

      // 再検査を作成
      const newInspectionId = await reInspectionService.createReInspection(inspectionId)

      // 新しい検査の詳細ページに遷移
      navigate(Routing.Desktop.Task.Detail.path.replace(':taskId', newInspectionId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '再検査の作成に失敗しました'
      setError(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }

  /**
   * NG項目数を取得
   */
  const getNGCount = async (inspectionId: string): Promise<number> => {
    try {
      return await reInspectionService.countNGItems(inspectionId)
    } catch (err) {
      console.error('Failed to get NG count:', err)
      return 0
    }
  }

  return {
    isCreating,
    error,
    createReInspection,
    getNGCount,
  }
}
