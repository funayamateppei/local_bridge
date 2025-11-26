import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, AlertCircle, FileCheck, type LucideIcon } from 'lucide-react'
import { Routing } from '@/presentation/routes/routing'
import type { InspectionItem, Area, Equipment, InspectionStatus } from '@/domain/types/inspection'

interface TaskListViewProps {
  tasks: InspectionItem[]
  areas: Record<string, Area>
  equipments: Record<string, Equipment>
  isLoading: boolean
}

const statusConfig: Record<InspectionStatus, { label: string; icon: LucideIcon; color: string }> = {
  todo: { label: 'To Do', icon: Clock, color: 'bg-gray-500' },
  in_review: { label: 'In Review', icon: FileCheck, color: 'bg-blue-500' },
  done: { label: 'Done', icon: CheckCircle2, color: 'bg-green-500' },
  correction_needed: { label: 'Re-check Needed', icon: AlertCircle, color: 'bg-red-500' },
}

export const TaskListView = ({ tasks, areas, equipments, isLoading }: TaskListViewProps) => {
  const [filterStatus, setFilterStatus] = useState<InspectionStatus | 'all'>('all')

  if (isLoading) {
    return <div className="p-8 text-center">Loading tasks...</div>
  }

  const filteredTasks =
    filterStatus === 'all' ? tasks : tasks.filter((t) => t.status === filterStatus)

  const statusCounts = {
    all: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_review: tasks.filter((t) => t.status === 'in_review').length,
    done: tasks.filter((t) => t.status === 'done').length,
    correction_needed: tasks.filter((t) => t.status === 'correction_needed').length,
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Task Management</h1>
          <Link
            to={Routing.Desktop.Task.Create.path}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Create New Task
          </Link>
        </div>

        {/* Status Filter */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-primary text-white'
                : 'bg-surface/30 text-foreground hover:bg-surface/50'
            }`}
          >
            All ({statusCounts.all})
          </button>
          {Object.entries(statusConfig).map(([status, config]) => {
            const Icon = config.icon
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status as InspectionStatus)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? `${config.color} text-white`
                    : 'bg-surface/30 text-foreground hover:bg-surface/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                {config.label} ({statusCounts[status as InspectionStatus]})
              </button>
            )
          })}
        </div>

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <div className="rounded-xl border border-surface bg-surface/20 p-12 text-center">
            <p className="text-muted-foreground">No tasks found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const area = areas[task.areaId]
              const equipment = equipments[task.equipmentId]
              const statusInfo = statusConfig[task.status]
              const StatusIcon = statusInfo.icon

              return (
                <Link
                  key={task.id}
                  to={Routing.Desktop.Task.Detail.path.replace(':taskId', task.id)}
                  className="block rounded-xl border border-surface bg-surface/30 p-6 transition-all hover:border-primary hover:bg-surface/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                          {area?.name || 'Unknown'}
                        </span>
                        <span className="text-sm text-muted-foreground">→</span>
                        <span className="rounded-full bg-secondary/10 px-2 py-1 text-xs font-semibold text-secondary">
                          {equipment?.name || 'Unknown'}
                        </span>
                      </div>
                      <h3 className="mb-1 text-lg font-bold">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <div
                      className={`ml-4 flex items-center gap-2 rounded-full ${statusInfo.color} px-3 py-1.5 text-white`}
                    >
                      <StatusIcon className="h-4 w-4" />
                      <span className="text-xs font-semibold">{statusInfo.label}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
