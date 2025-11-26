import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileCheck,
  XCircle,
  MinusCircle,
} from 'lucide-react'
import { inspectionRepository } from '@/infrastructure/repositories/InspectionRepositoryImpl'
import { Routing } from '@/presentation/routes/routing'
import { CreateReInspectionButton } from '@/presentation/components/CreateReInspectionButton'
import type { Inspection, InspectionItem, InspectionResult } from '@/domain/types/inspection'
import { Button } from '@/presentation/components/ui'

type FilterType = 'all' | 'ng' | 'todo' | 'done'

export const Page = () => {
  const { inspectionId } = useParams<{ inspectionId: string }>()
  const navigate = useNavigate()

  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [items, setItems] = useState<InspectionItem[]>([])
  const [results, setResults] = useState<Map<string, InspectionResult>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')

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

        // 結果を取得
        const itemIds = itemsData.map((i) => i.id)
        if (itemIds.length > 0) {
          const resultsMap = await inspectionRepository.getLatestResultsByItemIds(itemIds)
          setResults(resultsMap)
        }
      } catch (error) {
        console.error('Failed to load inspection details:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [inspectionId, navigate])

  if (isLoading || !inspection) {
    return <div className="p-8 text-center">読み込み中...</div>
  }

  const statusConfig = {
    todo: { label: '未実施', icon: Clock, color: 'text-gray-500', bg: 'bg-gray-500/10' },
    in_review: {
      label: '確認中',
      icon: FileCheck,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    done: { label: '完了', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
    correction_needed: {
      label: '要再検査',
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
  }

  const statusInfo = statusConfig[inspection.status]
  const StatusIcon = statusInfo.icon

  // フィルタリングロジック
  const filteredItems = items.filter((item) => {
    const result = results.get(item.id)

    switch (filter) {
      case 'ng':
        return result?.verdict === 'ng'
      case 'todo':
        return item.status === 'todo'
      case 'done':
        return item.status === 'done' || item.status === 'in_review'
      default:
        return true
    }
  })

  const counts = {
    all: items.length,
    ng: items.filter((i) => results.get(i.id)?.verdict === 'ng').length,
    todo: items.filter((i) => i.status === 'todo').length,
    done: items.filter((i) => i.status === 'done' || i.status === 'in_review').length,
  }

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
            検査一覧に戻る
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
              <span>作成日: {new Date(inspection.createdAt).toLocaleDateString()}</span>
            </div>
            <div>ID: {inspection.id}</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            すべて ({counts.all})
          </Button>
          <Button
            variant={filter === 'ng' ? 'default' : 'ghost'}
            onClick={() => setFilter('ng')}
            size="sm"
            className={
              filter === 'ng'
                ? 'bg-red-500 hover:bg-red-600'
                : 'text-red-500 hover:text-red-600 hover:bg-red-50'
            }
          >
            NGのみ ({counts.ng})
          </Button>
          <Button
            variant={filter === 'todo' ? 'default' : 'ghost'}
            onClick={() => setFilter('todo')}
            size="sm"
          >
            未実施 ({counts.todo})
          </Button>
          <Button
            variant={filter === 'done' ? 'default' : 'ghost'}
            onClick={() => setFilter('done')}
            size="sm"
          >
            完了 ({counts.done})
          </Button>
        </div>

        {/* Items List */}
        <div className="rounded-xl border border-surface bg-surface/30">
          <div className="border-b border-surface p-4">
            <h2 className="text-lg font-semibold">検査項目 ({filteredItems.length})</h2>
          </div>

          <div className="divide-y divide-surface">
            {filteredItems.map((item) => {
              const itemStatusInfo = statusConfig[item.status]
              const result = results.get(item.id)

              let ResultIcon = MinusCircle
              let resultColor = 'text-gray-400'
              let resultLabel = '未実施'

              if (result) {
                if (result.verdict === 'ok') {
                  ResultIcon = CheckCircle2
                  resultColor = 'text-green-500'
                  resultLabel = 'OK'
                } else if (result.verdict === 'ng') {
                  ResultIcon = XCircle
                  resultColor = 'text-red-500'
                  resultLabel = 'NG'
                } else {
                  ResultIcon = MinusCircle
                  resultColor = 'text-gray-500'
                  resultLabel = '対象外'
                }
              }

              return (
                <Link
                  key={item.id}
                  // TODO: InspectionItem詳細ページへの正しいリンクを設定する
                  to="#"
                  className="flex items-center justify-between p-4 transition-colors hover:bg-surface/50 cursor-default"
                  onClick={(e) => e.preventDefault()} // 一時的に無効化
                >
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Result Badge */}
                    {result && (
                      <div className={`flex items-center gap-1.5 font-bold ${resultColor}`}>
                        <ResultIcon className="h-5 w-5" />
                        <span>{resultLabel}</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div
                      className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs ${itemStatusInfo.bg} ${itemStatusInfo.color}`}
                    >
                      <itemStatusInfo.icon className="h-3 w-3" />
                      <span className="font-medium">{itemStatusInfo.label}</span>
                    </div>
                  </div>
                </Link>
              )
            })}

            {filteredItems.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                条件に一致する項目はありません。
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
