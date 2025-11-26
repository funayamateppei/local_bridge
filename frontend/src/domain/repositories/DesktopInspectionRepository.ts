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

/**
 * Desktop用検査リポジトリインターフェース
 *
 * DesktopアプリはオンラインのみでIndexedDBを使用しないため、
 * API経由でデータを取得・更新します。
 */
export interface IDesktopInspectionRepository {
  // Master Data
  getAreas(): Promise<Area[]>
  getEquipments(areaId: string): Promise<Equipment[]>
  getAllEquipments(): Promise<Equipment[]>

  // Inspection
  getAllInspections(): Promise<Inspection[]>
  getInspectionById(id: string): Promise<Inspection | undefined>

  // InspectionItem (Task)
  getAllItems(): Promise<InspectionItem[]>
  getItemsByInspectionId(inspectionId: string): Promise<InspectionItem[]>
  getItemById(id: string): Promise<InspectionItem | undefined>
  createTask(task: {
    title: string
    description?: string
    areaId: string
    equipmentId: string
    status: InspectionStatus
    inspectionId?: string
  }): Promise<string>
  updateItemStatus(itemId: string, status: InspectionStatus): Promise<void>

  // Result
  getResultsByItemId(itemId: string): Promise<InspectionResult[]>
  getLatestResultsByItemIds(itemIds: string[]): Promise<Map<string, InspectionResult>>

  // Comment
  addComment(comment: Omit<InspectionComment, 'id' | 'createdAt'>): Promise<void>
  getCommentsByItemId(itemId: string): Promise<InspectionComment[]>

  // Evidence
  getEvidencesByResultId(resultId: string): Promise<Evidence[]>
}
