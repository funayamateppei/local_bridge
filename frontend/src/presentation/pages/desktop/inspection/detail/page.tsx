import { useParams, useNavigate } from 'react-router-dom'
import { useDesktopInspectionDetail } from '@/presentation/hooks/desktop'
import { InspectionDetailView } from '@/presentation/features/desktop/InspectionDetail/InspectionDetailView'
import { Routing } from '@/presentation/routes/routing'

export const Page = () => {
  const { inspectionId } = useParams<{ inspectionId: string }>()
  const navigate = useNavigate()

  const { inspection, items, results, isLoading, error } = useDesktopInspectionDetail(inspectionId)

  if (error) {
    navigate(Routing.Desktop.Inspection.List.path)
    return null
  }

  if (isLoading || !inspection) {
    return <div className="p-8 text-center">読み込み中...</div>
  }

  return <InspectionDetailView inspection={inspection} items={items} results={results} />
}
