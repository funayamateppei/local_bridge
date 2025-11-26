import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { mobileInspectionRepository } from '@/infrastructure/repositories/MobileInspectionRepositoryImpl'
import type {
  InspectionItem,
  Area,
  Equipment,
  InspectionVerdict,
} from '@/domain/types/inspection'
import { Routing } from '@/presentation/routes/routing'

/**
 * Mobile: タスク一覧を取得するhook
 */
export const useMobileTasks = () => {
  const [tasks, setTasks] = useState<InspectionItem[]>([])
  const [areas, setAreas] = useState<Record<string, Area>>({})
  const [equipments, setEquipments] = useState<Record<string, Equipment>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tasksData, areasData] = await Promise.all([
          mobileInspectionRepository.getAllItems(),
          mobileInspectionRepository.getAreas(),
        ])

        setTasks(tasksData)

        const areasMap = areasData.reduce(
          (acc: Record<string, Area>, area: Area) => {
            acc[area.id] = area
            return acc
          },
          {} as Record<string, Area>
        )
        setAreas(areasMap)

        const equipmentsMap: Record<string, Equipment> = {}
        const uniqueAreaIds = Array.from(new Set(tasksData.map((t) => t.areaId)))

        for (const areaId of uniqueAreaIds) {
          const eqs = await mobileInspectionRepository.getEquipments(areaId)
          eqs.forEach((eq: Equipment) => {
            equipmentsMap[eq.id] = eq
          })
        }
        setEquipments(equipmentsMap)
      } catch (error) {
        console.error('Failed to load tasks:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  return { tasks, areas, equipments, isLoading }
}

/**
 * Mobile: タスク詳細を取得するhook
 */
export const useMobileTaskDetail = (taskId: string | undefined) => {
  const navigate = useNavigate()
  const [task, setTask] = useState<InspectionItem | null>(null)
  const [area, setArea] = useState<Area | null>(null)
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTaskData = async () => {
      if (!taskId) {
        setIsLoading(false)
        return
      }

      try {
        const taskData = await mobileInspectionRepository.getItemById(taskId)
        if (!taskData) {
          setError('タスクが見つかりません')
          navigate(Routing.Mobile.Home.path)
          return
        }
        setTask(taskData)

        const areas = await mobileInspectionRepository.getAreas()
        const foundArea = areas.find((a: Area) => a.id === taskData.areaId)
        setArea(foundArea || null)

        const equipments = await mobileInspectionRepository.getEquipments(taskData.areaId)
        const foundEquipment = equipments.find((e: Equipment) => e.id === taskData.equipmentId)
        setEquipment(foundEquipment || null)
      } catch (err) {
        console.error('Failed to load task:', err)
        setError('タスクデータの読み込みに失敗しました')
      } finally {
        setIsLoading(false)
      }
    }
    loadTaskData()
  }, [taskId, navigate])

  return { task, area, equipment, isLoading, error }
}

/**
 * Mobile: 検査結果を送信するhook
 */
export const useMobileTaskSubmit = (taskId: string | undefined) => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitResult = useCallback(
    async (
      data: {
        verdict: InspectionVerdict
        note: string
        files: File[]
      },
      username: string
    ) => {
      if (!taskId || !username) return

      setIsSubmitting(true)
      try {
        // 証拠（写真・動画）を保存
        const evidenceIds: string[] = []
        for (const file of data.files) {
          const evidenceId = await mobileInspectionRepository.saveEvidence(
            {
              resultId: '',
              type: file.type.startsWith('video/') ? 'video' : 'image',
              mimeType: file.type,
            },
            file
          )
          evidenceIds.push(evidenceId)
        }

        // 結果を保存
        await mobileInspectionRepository.submitResult({
          inspectionItemId: taskId,
          verdict: data.verdict,
          note: data.note,
          evidenceIds,
          createdBy: username,
        })

        alert('検査結果を送信しました！')
        navigate(Routing.Mobile.Home.path)
      } catch (error) {
        console.error('Failed to submit result:', error)
        alert('検査結果の送信に失敗しました')
      } finally {
        setIsSubmitting(false)
      }
    },
    [taskId, navigate]
  )

  return { submitResult, isSubmitting }
}
