import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, AlertCircle, FileCheck, type LucideIcon } from 'lucide-react'
import { Routing } from '@/presentation/routes/routing'
import { CreateReInspectionButton } from '@/presentation/components/CreateReInspectionButton'
import type { Inspection, InspectionStatus } from '@/domain/types/inspection'

interface InspectionListViewProps {
  inspections: Inspection[]
  isLoading: boolean
}

const statusConfig: Record<InspectionStatus, { label: string; icon: LucideIcon; color: string }> = {
  todo: { label: '未実施', icon: Clock, color: 'bg-gray-500' },
  in_review: { label: '確認中', icon: FileCheck, color: 'bg-blue-500' },
  done: { label: '完了', icon: CheckCircle2, color: 'bg-green-500' },
  correction_needed: { label: '要再検査', icon: AlertCircle, color: 'bg-red-500' },
}

export const InspectionListView = ({ inspections, isLoading }: InspectionListViewProps) => {
  const [filterStatus, setFilterStatus] = useState<InspectionStatus | 'all'>('all')

  if (isLoading) {
    return <div className="p-8 text-center">読み込み中...</div>
  }

  const filteredInspections =
    filterStatus === 'all' ? inspections : inspections.filter((i) => i.status === filterStatus)

  const statusCounts = {
    all: inspections.length,
    todo: inspections.filter((i) => i.status === 'todo').length,
    in_review: inspections.filter((i) => i.status === 'in_review').length,
    done: inspections.filter((i) => i.status === 'done').length,
    correction_needed: inspections.filter((i) => i.status === 'correction_needed').length,
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">検査一覧</h1>
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
            すべて ({statusCounts.all})
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

        {/* Inspection List */}
        {filteredInspections.length === 0 ? (
          <div className="rounded-xl border border-surface bg-surface/20 p-12 text-center">
            <p className="text-muted-foreground">検査が見つかりません。</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInspections.map((inspection) => {
              const statusInfo = statusConfig[inspection.status]
              const StatusIcon = statusInfo.icon

              return (
                <div
                  key={inspection.id}
                  className="rounded-xl border border-surface bg-surface/30 p-6 transition-all hover:border-primary hover:bg-surface/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link
                        to={Routing.Desktop.Inspection.Detail.path.replace(
                          ':inspectionId',
                          inspection.id
                        )}
                        className="block"
                      >
                        <h3 className="mb-1 text-lg font-bold hover:text-primary">
                          {inspection.title}
                        </h3>
                        {inspection.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {inspection.description}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-muted-foreground">
                          作成日: {new Date(inspection.createdAt).toLocaleString()}
                        </p>
                      </Link>
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      <div
                        className={`flex items-center gap-2 rounded-full ${statusInfo.color} px-3 py-1.5 text-white`}
                      >
                        <StatusIcon className="h-4 w-4" />
                        <span className="text-xs font-semibold">{statusInfo.label}</span>
                      </div>

                      {/* 完了した検査のみ再検査ボタンを表示 */}
                      {inspection.status === 'done' && (
                        <CreateReInspectionButton inspectionId={inspection.id} />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
