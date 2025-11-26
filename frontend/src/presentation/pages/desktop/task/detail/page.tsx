import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { inspectionRepository } from '@/infrastructure/repositories/InspectionRepositoryImpl'
import { TaskDetailView } from '@/presentation/features/desktop/TaskDetail/TaskDetailView'
import { useAuth } from '@/presentation/hooks/auth/useAuth'
import type {
  InspectionItem,
  Area,
  Equipment,
  InspectionResult,
  InspectionComment,
  Evidence,
} from '@/domain/types/inspection'
import { Routing } from '@/presentation/routes/routing'

export const Page = () => {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const { username } = useAuth()

  const [task, setTask] = useState<InspectionItem | null>(null)
  const [area, setArea] = useState<Area | null>(null)
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [results, setResults] = useState<InspectionResult[]>([])
  const [comments, setComments] = useState<InspectionComment[]>([])
  const [evidences, setEvidences] = useState<Record<string, Evidence[]>>({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      if (!taskId) return

      try {
        const taskData = await inspectionRepository.getItemById(taskId)
        if (!taskData) {
          alert('Task not found')
          navigate(Routing.Desktop.Task.path)
          return
        }
        setTask(taskData)

        const areas = await inspectionRepository.getAreas()
        const foundArea = areas.find((a) => a.id === taskData.areaId)
        setArea(foundArea || null)

        const equipments = await inspectionRepository.getEquipments(taskData.areaId)
        const foundEquipment = equipments.find((e) => e.id === taskData.equipmentId)
        setEquipment(foundEquipment || null)

        const resultsData = await inspectionRepository.getResultsByItemId(taskId)
        setResults(resultsData)

        const commentsData = await inspectionRepository.getCommentsByItemId(taskId)
        setComments(commentsData)

        // 各結果の証拠を取得
        const evidencesMap: Record<string, Evidence[]> = {}
        for (const result of resultsData) {
          const evs = await inspectionRepository.getEvidencesByResultId(result.id)
          evidencesMap[result.id] = evs
        }
        setEvidences(evidencesMap)
      } catch (error) {
        console.error('Failed to load task data:', error)
        alert('Failed to load task data')
      }
    }
    loadData()
  }, [taskId, navigate])

  const handleAddComment = async (content: string) => {
    if (!taskId || !username) return
    setIsLoading(true)
    try {
      await inspectionRepository.addComment({
        inspectionItemId: taskId,
        content,
        createdBy: username, // 実際のユーザー名を使用
      })
      // コメントリストを再取得
      const commentsData = await inspectionRepository.getCommentsByItemId(taskId)
      setComments(commentsData)
    } catch (error) {
      console.error('Failed to add comment:', error)
      alert('Failed to add comment')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!taskId || !username) return
    setIsLoading(true)
    try {
      await inspectionRepository.updateItemStatus(taskId, 'done')
      await inspectionRepository.addComment({
        inspectionItemId: taskId,
        content: 'Task approved and marked as done.',
        createdBy: username,
        isSystemComment: true,
      })
      alert('Task approved successfully!')
      navigate(Routing.Desktop.Task.path)
    } catch (error) {
      console.error('Failed to approve task:', error)
      alert('Failed to approve task')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestCorrection = async (comment: string) => {
    if (!taskId || !username) return
    setIsLoading(true)
    try {
      await inspectionRepository.updateItemStatus(taskId, 'correction_needed')
      await inspectionRepository.addComment({
        inspectionItemId: taskId,
        content: comment,
        createdBy: username,
      })
      alert('Correction requested. Task moved to re-check status.')
      navigate(Routing.Desktop.Task.path)
    } catch (error) {
      console.error('Failed to request correction:', error)
      alert('Failed to request correction')
    } finally {
      setIsLoading(false)
    }
  }

  if (!task || !area || !equipment) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <TaskDetailView
      task={task}
      area={area}
      equipment={equipment}
      results={results}
      comments={comments}
      evidences={evidences}
      onAddComment={handleAddComment}
      onApprove={handleApprove}
      onRequestCorrection={handleRequestCorrection}
      isLoading={isLoading}
    />
  )
}
