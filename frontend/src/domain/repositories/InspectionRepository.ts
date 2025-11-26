import type { InspectionStatus } from '@/domain/types/inspection'
import type {
  Area,
  Equipment,
  InspectionTask,
  InspectionResult,
  Evidence,
  InspectionComment,
} from '@/domain/entities'

export interface IInspectionRepository {
  getAreas(): Promise<Area[]>
  getEquipments(areaId: string): Promise<Equipment[]>
  createTask(task: Omit<InspectionTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<void>
  getTasksByArea(areaId: string): Promise<InspectionTask[]>
  getAllTasks(): Promise<InspectionTask[]>
  getTaskById(id: string): Promise<InspectionTask | undefined>
  submitResult(result: Omit<InspectionResult, 'id' | 'createdAt'>): Promise<void>
  saveEvidence(evidence: Omit<Evidence, 'id' | 'createdAt'>): Promise<string> // Returns evidence ID
  getEvidencesByResultId(resultId: string): Promise<Evidence[]>
  getResultsByTaskId(taskId: string): Promise<InspectionResult[]>
  addComment(comment: Omit<InspectionComment, 'id' | 'createdAt'>): Promise<void>
  getCommentsByTaskId(taskId: string): Promise<InspectionComment[]>
  updateTaskStatus(taskId: string, status: InspectionStatus): Promise<void>
}
