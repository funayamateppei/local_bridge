import { useState, useEffect } from 'react'
import { inspectionRepository } from '@/infrastructure/repositories/InspectionRepositoryImpl'
import { TaskListView } from '@/presentation/features/mobile/TaskList/TaskListView'
import type { InspectionItem, Area, Equipment } from '@/domain/types/inspection'

export const Page = () => {
  const [tasks, setTasks] = useState<InspectionItem[]>([])
  const [areas, setAreas] = useState<Record<string, Area>>({})
  const [equipments, setEquipments] = useState<Record<string, Equipment>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tasksData, areasData] = await Promise.all([
          inspectionRepository.getAllItems(),
          inspectionRepository.getAreas(),
        ])

        setTasks(tasksData)

        // エリアをIDで引けるようにMap化
        const areasMap = areasData.reduce(
          (acc, area) => {
            acc[area.id] = area
            return acc
          },
          {} as Record<string, Area>
        )
        setAreas(areasMap)

        // 必要なターゲット情報を取得
        // 本来は一括取得APIが欲しいが、今回はループで取得
        const equipmentsMap: Record<string, Equipment> = {}
        const uniqueAreaIds = Array.from(new Set(tasksData.map((t) => t.areaId)))

        for (const areaId of uniqueAreaIds) {
          const eqs = await inspectionRepository.getEquipments(areaId)
          eqs.forEach((eq) => {
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

  return <TaskListView tasks={tasks} areas={areas} equipments={equipments} isLoading={isLoading} />
}
