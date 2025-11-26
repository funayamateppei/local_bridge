import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, CheckCircle2, AlertCircle, Clock, FileCheck } from 'lucide-react'
import { inspectionRepository } from '@/infrastructure/repositories/InspectionRepositoryImpl'
import { Routing } from '@/presentation/routes/routing'
import { CreateReInspectionButton } from '@/presentation/components/CreateReInspectionButton'
import type { Inspection, InspectionItem } from '@/domain/types/inspection'

export const Page = () => {
  const { inspectionId } = useParams<{ inspectionId: string }>()
  const navigate = useNavigate()

  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [items, setItems] = useState<InspectionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!inspectionId) return

      try {
        const [inspectionData, itemsData] = await Promise.all([
          inspectionRepository.getInspectionById(inspectionId),
          inspectionRepository.getItemsByInspectionId(inspectionId),
        ])

        if (!inspectionData) {
          // 検査が見つからない場合
          navigate(Routing.Desktop.Inspection.List.path) // 一覧へ戻る
          return
        }

        setInspection(inspectionData)
        setItems(itemsData)
      } catch (error) {
        console.error('Failed to load inspection details:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [inspectionId, navigate])

  if (isLoading || !inspection) {
    return <div className="p-8 text-center">Loading...</div>
  }

  const statusConfig = {
    todo: { label: 'To Do', icon: Clock, color: 'text-gray-500', bg: 'bg-gray-500/10' },
    in_review: {
      label: 'In Review',
      icon: FileCheck,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    done: { label: 'Done', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
    correction_needed: {
      label: 'Re-check Needed',
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
  }

  const statusInfo = statusConfig[inspection.status]
  const StatusIcon = statusInfo.icon

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            to={Routing.Desktop.Inspection.List.path}
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Inspections
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{inspection.title}</h1>
              {inspection.description && (
                <p className="text-muted-foreground">{inspection.description}</p>
              )}
            </div>

            <div className="flex flex-col items-end gap-3">
              <div
                className={`flex items-center gap-2 rounded-full px-4 py-2 ${statusInfo.bg} ${statusInfo.color}`}
              >
                <StatusIcon className="h-5 w-5" />
                <span className="font-semibold">{statusInfo.label}</span>
              </div>

              {inspection.status === 'done' && (
                <CreateReInspectionButton inspectionId={inspection.id} />
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Created: {new Date(inspection.createdAt).toLocaleDateString()}</span>
            </div>
            <div>ID: {inspection.id}</div>
          </div>
        </div>

        {/* Items List */}
        <div className="rounded-xl border border-surface bg-surface/30">
          <div className="border-b border-surface p-4">
            <h2 className="text-lg font-semibold">Inspection Items ({items.length})</h2>
          </div>

          <div className="divide-y divide-surface">
            {items.map((item) => {
              const itemStatusInfo = statusConfig[item.status]
              const ItemStatusIcon = itemStatusInfo.icon

              return (
                <Link
                  key={item.id}
                  to={Routing.Desktop.Task.Detail.path.replace(':taskId', item.id)}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-surface/50"
                >
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div
                      className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs ${itemStatusInfo.bg} ${itemStatusInfo.color}`}
                    >
                      <ItemStatusIcon className="h-3 w-3" />
                      <span className="font-medium">{itemStatusInfo.label}</span>
                    </div>
                    <div className="text-muted-foreground">→</div>
                  </div>
                </Link>
              )
            })}

            {items.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No items found in this inspection.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
