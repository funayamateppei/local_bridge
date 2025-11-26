import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { inspectionRepository } from '@/infrastructure/repositories/InspectionRepositoryImpl'
import { InspectionView } from '@/presentation/features/mobile/Inspection/InspectionView'
import { useAuth } from '@/presentation/hooks/auth/useAuth'
import type { InspectionItem, Area, Equipment, InspectionVerdict } from '@/domain/types/inspection'
import { Routing } from '@/presentation/routes/routing'

export const Page = () => {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const { username } = useAuth()

  const [task, setTask] = useState<InspectionItem | null>(null)
  const [area, setArea] = useState<Area | null>(null)
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadTaskData = async () => {
      if (!taskId) return

      try {
        const taskData = await inspectionRepository.getItemById(taskId)
        if (!taskData) {
          alert('Task not found')
          navigate(Routing.Mobile.Home.path)
          return
        }
        setTask(taskData)

        // エリアとターゲット情報を取得
        const areas = await inspectionRepository.getAreas()
        const foundArea = areas.find((a) => a.id === taskData.areaId)
        setArea(foundArea || null)

        const equipments = await inspectionRepository.getEquipments(taskData.areaId)
        const foundEquipment = equipments.find((e) => e.id === taskData.equipmentId)
        setEquipment(foundEquipment || null)
      } catch (error) {
        console.error('Failed to load task:', error)
        alert('Failed to load task data')
      }
    }
    loadTaskData()
  }, [taskId, navigate])

  const handleSubmit = async (data: {
    verdict: InspectionVerdict
    note: string
    files: File[]
  }) => {
    if (!task || !taskId || !username) return

    setIsLoading(true)
    try {
      // 証拠（写真・動画）を保存
      const evidenceIds: string[] = []
      for (const file of data.files) {
        // TODO: OPFS実装後に修正
        const evidenceId = await inspectionRepository.saveEvidence({
          resultId: '', // 結果IDは仮置き（本来は結果登録後に紐付け）
          type: file.type.startsWith('video/') ? 'video' : 'image',
          filePath: `/evidence/${Date.now()}_${file.name}`, // 仮のパス
          mimeType: file.type,
        })
        evidenceIds.push(evidenceId)
      }

      // 結果を保存
      await inspectionRepository.submitResult({
        inspectionItemId: taskId,
        verdict: data.verdict,
        note: data.note,
        evidenceIds,
        createdBy: username, // 実際のユーザー名を使用
      })

      alert('Inspection result submitted successfully!')
      navigate(Routing.Mobile.Home.path)
    } catch (error) {
      console.error('Failed to submit result:', error)
      alert('Failed to submit inspection result')
    } finally {
      setIsLoading(false)
    }
  }

  if (!task || !area || !equipment) {
    return <div className="p-4 text-center">Loading...</div>
  }

  return (
    <InspectionView
      task={task}
      area={area}
      equipment={equipment}
      onSubmit={handleSubmit}
      isLoading={isLoading}
    />
  )
}
