import { Link } from 'react-router-dom'
import { CheckCircle2, AlertCircle, Clock, ArrowRight } from 'lucide-react'
import type { InspectionTask, Area, Equipment } from '@/domain/types/inspection'
import { Routing } from '@/presentation/routes/routing'

interface TaskListViewProps {
  tasks: InspectionTask[]
  areas: Record<string, Area>
  equipments: Record<string, Equipment>
  isLoading: boolean
}

export const TaskListView = ({ tasks, areas, equipments, isLoading }: TaskListViewProps) => {
  if (isLoading) {
    return <div className="p-4 text-center">Loading tasks...</div>
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-xl font-bold">All Clear!</h2>
        <p className="text-muted-foreground mt-2">No pending inspections assigned to you.</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      <h2 className="text-2xl font-bold mb-6">My Tasks</h2>

      <div className="space-y-3">
        {tasks.map((task) => {
          const area = areas[task.areaId]
          const equipment = equipments[task.equipmentId]

          return (
            <Link
              key={task.id}
              to={Routing.Mobile.Task.Detail.path.replace(':taskId', task.id)}
              className="block"
            >
              <div className="bg-surface/40 border border-surface rounded-xl p-4 active:scale-98 transition-transform">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {area?.name || 'Unknown Area'}
                    </span>
                    {task.status === 'correction_needed' && (
                      <span className="text-xs font-semibold bg-red-500/10 text-red-500 px-2 py-1 rounded-full flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Re-check
                      </span>
                    )}
                  </div>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>

                <h3 className="text-lg font-bold mb-1">{task.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Target: {equipment?.name || 'Unknown Equipment'}
                </p>

                <div className="flex justify-between items-center text-sm text-primary font-medium">
                  <span>Start Inspection</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
