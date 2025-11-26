import { useDesktopInspections } from '@/presentation/hooks/desktop'
import { InspectionListView } from '@/presentation/features/desktop/InspectionList/InspectionListView'

export const Page = () => {
  const { inspections, isLoading } = useDesktopInspections()

  return <InspectionListView inspections={inspections} isLoading={isLoading} />
}
