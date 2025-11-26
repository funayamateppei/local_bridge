import { useState, useEffect } from 'react'
import { inspectionRepository } from '@/infrastructure/repositories/InspectionRepositoryImpl'
import { TaskCreateView } from '@/presentation/features/admin/TaskCreateView'
import type { Area, Equipment } from '@/domain/types/inspection'

export const Page = () => {
  const [areas, setAreas] = useState<Area[]>([])
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      // エリア一覧を取得
      const areasData = await inspectionRepository.getAreas()
      setAreas(areasData)

      // 全ターゲットを取得（View側でフィルタリングするため）
      // 本来はエリア選択時にAPIを叩くのが良いが、今回は全件取得で対応
      const allEquipments: Equipment[] = []
      for (const area of areasData) {
        const eqs = await inspectionRepository.getEquipments(area.id)
        allEquipments.push(...eqs)
      }
      setEquipments(allEquipments)
    }
    loadData()
  }, [])

  const handleCreateTask = async (data: {
    title: string
    description: string
    areaId: string
    equipmentId: string
  }) => {
    setIsLoading(true)
    try {
      await inspectionRepository.createTask({
        ...data,
        status: 'todo',
      })
      alert('Task created successfully!')
      // TODO: タスク一覧画面へ遷移
      // navigate(Routing.Admin.Task.List.path)
    } catch (error) {
      console.error('Failed to create task:', error)
      alert('Failed to create task.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <TaskCreateView
      areas={areas}
      equipments={equipments}
      onSubmit={handleCreateTask}
      isLoading={isLoading}
    />
  )
}
