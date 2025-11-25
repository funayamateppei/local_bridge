import { db } from '@/infrastructure/db'
import type { IInspectionRepository } from '@/domain/repositories/InspectionRepository'
import type {
  Area,
  Equipment,
  InspectionTask,
  InspectionResult,
  Evidence,
  InspectionComment,
  InspectionStatus,
} from '@/domain/types/inspection'
import { v4 as uuidv4 } from 'uuid'

export class InspectionRepositoryImpl implements IInspectionRepository {
  async getAreas(): Promise<Area[]> {
    return db.areas.toArray()
  }

  async getEquipments(areaId: string): Promise<Equipment[]> {
    return db.equipments.where('areaId').equals(areaId).toArray()
  }

  async createTask(task: Omit<InspectionTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const now = Date.now()
    const newTask: InspectionTask = {
      ...task,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    }
    await db.inspectionTasks.add(newTask)
  }

  async getTasksByArea(areaId: string): Promise<InspectionTask[]> {
    return db.inspectionTasks.where('areaId').equals(areaId).toArray()
  }

  async getAllTasks(): Promise<InspectionTask[]> {
    return db.inspectionTasks.toArray()
  }

  async getTaskById(id: string): Promise<InspectionTask | undefined> {
    return db.inspectionTasks.get(id)
  }

  async submitResult(result: Omit<InspectionResult, 'id' | 'createdAt'>): Promise<void> {
    const now = Date.now()
    const newResult: InspectionResult = {
      ...result,
      id: uuidv4(),
      createdAt: now,
    }
    await db.inspectionResults.add(newResult)

    // タスクのステータスを更新
    await db.inspectionTasks.update(result.taskId, {
      status: 'in_review',
      updatedAt: now,
    })
  }

  async saveEvidence(evidence: Omit<Evidence, 'id' | 'createdAt'>): Promise<string> {
    const now = Date.now()
    const id = uuidv4()
    const newEvidence: Evidence = {
      ...evidence,
      id,
      createdAt: now,
    }
    await db.evidences.add(newEvidence)
    return id
  }

  async getEvidencesByResultId(resultId: string): Promise<Evidence[]> {
    return db.evidences.where('resultId').equals(resultId).toArray()
  }

  async getResultsByTaskId(taskId: string): Promise<InspectionResult[]> {
    return db.inspectionResults.where('taskId').equals(taskId).toArray()
  }

  async addComment(comment: Omit<InspectionComment, 'id' | 'createdAt'>): Promise<void> {
    const now = Date.now()
    const newComment: InspectionComment = {
      ...comment,
      id: uuidv4(),
      createdAt: now,
    }
    await db.inspectionComments.add(newComment)
  }

  async getCommentsByTaskId(taskId: string): Promise<InspectionComment[]> {
    return db.inspectionComments.where('taskId').equals(taskId).toArray()
  }

  async updateTaskStatus(taskId: string, status: InspectionStatus): Promise<void> {
    await db.inspectionTasks.update(taskId, {
      status,
      updatedAt: Date.now(),
    })
  }
}

export const inspectionRepository = new InspectionRepositoryImpl()
