import { useDesktopTasks } from '@/presentation/hooks/desktop'
import { TaskListView } from '@/presentation/features/desktop/TaskList/TaskListView'

export const Page = () => {
  const { tasks, areas, equipments, isLoading } = useDesktopTasks()

  return <TaskListView tasks={tasks} areas={areas} equipments={equipments} isLoading={isLoading} />
}
