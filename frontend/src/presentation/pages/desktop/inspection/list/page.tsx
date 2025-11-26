import { useState, useEffect } from 'react'
import { inspectionRepository } from '@/infrastructure/repositories/InspectionRepositoryImpl'
import { InspectionListView } from '@/presentation/features/desktop/InspectionList/InspectionListView'
import type { Inspection } from '@/domain/types/inspection'

export const Page = () => {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const inspectionsData = await inspectionRepository.getAllInspections()
        setInspections(inspectionsData)
      } catch (error) {
        console.error('Failed to load inspections:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  return <InspectionListView inspections={inspections} isLoading={isLoading} />
}
