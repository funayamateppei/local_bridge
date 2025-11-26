import type { InspectionStatus } from '@/domain/types/inspection'
import type {
  Area,
  Equipment,
  Inspection,
  InspectionItem,
  InspectionResult,
  Evidence,
  InspectionComment,
} from '@/domain/entities'

export interface IInspectionRepository {
  // Master Data
  getAreas(): Promise<Area[]>
  getEquipments(areaId: string): Promise<Equipment[]>

  // Inspection
  createInspection(inspection: Omit<Inspection, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>
  getAllInspections(): Promise<Inspection[]>
  getInspectionById(id: string): Promise<Inspection | undefined>

  // InspectionItem
  createInspectionItem(item: Omit<InspectionItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<void>
  getItemsByInspectionId(inspectionId: string): Promise<InspectionItem[]>
  getAllItems(): Promise<InspectionItem[]>
  getItemById(id: string): Promise<InspectionItem | undefined>

  // Result & Evidence
  submitResult(result: Omit<InspectionResult, 'id' | 'createdAt'>): Promise<void>
  saveEvidence(
    evidence: Omit<Evidence, 'id' | 'createdAt' | 'filePath'>,
    file: Blob
  ): Promise<string> // Returns evidence ID
  getEvidencesByResultId(resultId: string): Promise<Evidence[]>
  getResultsByItemId(itemId: string): Promise<InspectionResult[]>
  getLatestResultsByItemIds(itemIds: string[]): Promise<Map<string, InspectionResult>>

  // Comment
  addComment(comment: Omit<InspectionComment, 'id' | 'createdAt'>): Promise<void>
  getCommentsByItemId(itemId: string): Promise<InspectionComment[]>

  // Status Update
  updateItemStatus(itemId: string, status: InspectionStatus): Promise<void>
  updateInspectionStatus(inspectionId: string, status: InspectionStatus): Promise<void>
}
