import { useState, useEffect, useCallback } from 'react'
import { desktopInspectionRepository } from '@/infrastructure/repositories/DesktopInspectionRepositoryImpl'
import type {
  Inspection,
  InspectionItem,
  InspectionResult,
  InspectionComment,
  Evidence,
  Area,
  Equipment,
} from '@/domain/entities'
import type { InspectionStatus } from '@/domain/types/inspection'

/**
 * 検査一覧を取得するフック
 */
export const useDesktopInspections = () => {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await desktopInspectionRepository.getAllInspections()
      setInspections(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '検査一覧の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { inspections, isLoading, error, reload: load }
}

/**
 * 検査詳細を取得するフック
 */
export const useDesktopInspectionDetail = (inspectionId: string | undefined) => {
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [items, setItems] = useState<InspectionItem[]>([])
  const [results, setResults] = useState<Map<string, InspectionResult>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!inspectionId) return

    setIsLoading(true)
    setError(null)
    try {
      const [inspectionData, itemsData] = await Promise.all([
        desktopInspectionRepository.getInspectionById(inspectionId),
        desktopInspectionRepository.getItemsByInspectionId(inspectionId),
      ])

      setInspection(inspectionData || null)
      setItems(itemsData)

      // 結果を取得
      if (itemsData.length > 0) {
        const itemIds = itemsData.map((i) => i.id)
        const resultsMap = await desktopInspectionRepository.getLatestResultsByItemIds(itemIds)
        setResults(resultsMap)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '検査詳細の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [inspectionId])

  useEffect(() => {
    load()
  }, [load])

  return { inspection, items, results, isLoading, error, reload: load }
}

/**
 * タスク一覧を取得するフック
 */
export const useDesktopTasks = () => {
  const [tasks, setTasks] = useState<InspectionItem[]>([])
  const [areas, setAreas] = useState<Record<string, Area>>({})
  const [equipments, setEquipments] = useState<Record<string, Equipment>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [tasksData, areasData] = await Promise.all([
        desktopInspectionRepository.getAllItems(),
        desktopInspectionRepository.getAreas(),
      ])

      setTasks(tasksData)

      // エリアをMap化
      const areasMap = areasData.reduce(
        (acc, area) => {
          acc[area.id] = area
          return acc
        },
        {} as Record<string, Area>
      )
      setAreas(areasMap)

      // ユニークなエリアIDから設備を取得
      const equipmentsMap: Record<string, Equipment> = {}
      const uniqueAreaIds = Array.from(new Set(tasksData.map((t) => t.areaId)))

      for (const areaId of uniqueAreaIds) {
        const eqs = await desktopInspectionRepository.getEquipments(areaId)
        eqs.forEach((eq) => {
          equipmentsMap[eq.id] = eq
        })
      }
      setEquipments(equipmentsMap)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'タスク一覧の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { tasks, areas, equipments, isLoading, error, reload: load }
}

/**
 * タスク詳細を取得するフック
 */
export const useDesktopTaskDetail = (taskId: string | undefined) => {
  const [task, setTask] = useState<InspectionItem | null>(null)
  const [area, setArea] = useState<Area | null>(null)
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [results, setResults] = useState<InspectionResult[]>([])
  const [comments, setComments] = useState<InspectionComment[]>([])
  const [evidences, setEvidences] = useState<Record<string, Evidence[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!taskId) return

    setIsLoading(true)
    setError(null)
    try {
      const taskData = await desktopInspectionRepository.getItemById(taskId)
      if (!taskData) {
        setError('タスクが見つかりません')
        setIsLoading(false)
        return
      }
      setTask(taskData)

      const [areasData, resultsData, commentsData] = await Promise.all([
        desktopInspectionRepository.getAreas(),
        desktopInspectionRepository.getResultsByItemId(taskId),
        desktopInspectionRepository.getCommentsByItemId(taskId),
      ])

      const foundArea = areasData.find((a) => a.id === taskData.areaId)
      setArea(foundArea || null)

      if (foundArea) {
        const equipmentsData = await desktopInspectionRepository.getEquipments(foundArea.id)
        const foundEquipment = equipmentsData.find((e) => e.id === taskData.equipmentId)
        setEquipment(foundEquipment || null)
      }

      setResults(resultsData)
      setComments(commentsData)

      // 各結果の証拠を取得
      const evidencesMap: Record<string, Evidence[]> = {}
      for (const result of resultsData) {
        const evs = await desktopInspectionRepository.getEvidencesByResultId(result.id)
        evidencesMap[result.id] = evs
      }
      setEvidences(evidencesMap)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'タスク詳細の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    load()
  }, [load])

  return { task, area, equipment, results, comments, evidences, isLoading, error, reload: load }
}

/**
 * タスク作成用のフック
 */
export const useDesktopTaskCreate = () => {
  const [areas, setAreas] = useState<Area[]>([])
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [areasData, equipmentsData] = await Promise.all([
          desktopInspectionRepository.getAreas(),
          desktopInspectionRepository.getAllEquipments(),
        ])
        setAreas(areasData)
        setEquipments(equipmentsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
      }
    }
    loadData()
  }, [])

  const createTask = async (data: {
    title: string
    description?: string
    areaId: string
    equipmentId: string
  }) => {
    setIsLoading(true)
    setError(null)
    try {
      const id = await desktopInspectionRepository.createTask({
        ...data,
        status: 'todo',
      })
      return id
    } catch (err) {
      const message = err instanceof Error ? err.message : 'タスクの作成に失敗しました'
      setError(message)
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return { areas, equipments, isLoading, error, createTask }
}

/**
 * タスクのアクション（承認、差し戻し、コメント追加）用のフック
 */
export const useDesktopTaskActions = (taskId: string | undefined) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addComment = async (content: string, createdBy: string) => {
    if (!taskId) return

    setIsLoading(true)
    setError(null)
    try {
      await desktopInspectionRepository.addComment({
        inspectionItemId: taskId,
        content,
        createdBy,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'コメントの追加に失敗しました'
      setError(message)
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatus = async (status: InspectionStatus) => {
    if (!taskId) return

    setIsLoading(true)
    setError(null)
    try {
      await desktopInspectionRepository.updateItemStatus(taskId, status)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ステータスの更新に失敗しました'
      setError(message)
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const approve = async (createdBy: string) => {
    if (!taskId) return

    setIsLoading(true)
    setError(null)
    try {
      await desktopInspectionRepository.updateItemStatus(taskId, 'done')
      await desktopInspectionRepository.addComment({
        inspectionItemId: taskId,
        content: 'タスクを承認し、完了としました。',
        createdBy,
        isSystemComment: true,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : '承認に失敗しました'
      setError(message)
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const requestCorrection = async (comment: string, createdBy: string) => {
    if (!taskId) return

    setIsLoading(true)
    setError(null)
    try {
      await desktopInspectionRepository.updateItemStatus(taskId, 'correction_needed')
      await desktopInspectionRepository.addComment({
        inspectionItemId: taskId,
        content: comment,
        createdBy,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : '差し戻しに失敗しました'
      setError(message)
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return { isLoading, error, addComment, updateStatus, approve, requestCorrection }
}
