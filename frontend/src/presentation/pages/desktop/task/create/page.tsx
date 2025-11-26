import { useDesktopTaskCreate } from '@/presentation/hooks/desktop'
import { TaskCreateView } from '@/presentation/features/admin/TaskCreateView'

export const Page = () => {
  const { areas, equipments, isLoading, createTask } = useDesktopTaskCreate()

  const handleCreateTask = async (data: {
    title: string
    description: string
    areaId: string
    equipmentId: string
  }) => {
    try {
      await createTask(data)
      alert('タスクを作成しました')
      // TODO: タスク一覧画面へ遷移
    } catch (error) {
      console.error('Failed to create task:', error)
      alert('タスクの作成に失敗しました')
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
