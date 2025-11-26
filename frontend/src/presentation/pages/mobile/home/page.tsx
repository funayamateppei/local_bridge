import { useMobileTasks } from '@/presentation/hooks/mobile'
import { TaskListView } from '@/presentation/features/mobile/TaskList/TaskListView'

export const Page = () => {
  const { tasks, areas, equipments, isLoading } = useMobileTasks()

  return <TaskListView tasks={tasks} areas={areas} equipments={equipments} isLoading={isLoading} />
}
