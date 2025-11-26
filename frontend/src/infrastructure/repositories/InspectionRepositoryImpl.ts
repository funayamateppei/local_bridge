import { db } from '@/infrastructure/db'
import type { IInspectionRepository } from '@/domain/repositories/InspectionRepository'
import {
  Area,
  Equipment,
  InspectionTask,
  InspectionResult,
  Evidence,
  InspectionComment,
} from '@/domain/entities'
import type { InspectionStatus } from '@/domain/types/inspection'
import { v4 as uuidv4 } from 'uuid'

export class InspectionRepositoryImpl implements IInspectionRepository {
  async getAreas(): Promise<Area[]> {
    const areas = await db.areas.toArray()
    return areas.map((a) => new Area(a.id, a.name))
  }

  async getEquipments(areaId: string): Promise<Equipment[]> {
    const equipments = await db.equipments.where('areaId').equals(areaId).toArray()
    return equipments.map((e) => new Equipment(e.id, e.name, e.areaId))
  }

  async createTask(task: Omit<InspectionTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const now = Date.now()
    const newTask = new InspectionTask(
      uuidv4(),
      task.title,
      task.areaId,
      task.equipmentId,
      task.status,
      now,
      now,
      task.description
    )
    // Dexie accepts the object, spread it to ensure it's a POJO if needed, but class instance is usually fine.
    // However, to match the interface expected by db.ts (which is from types/inspection.ts), we might need to cast or ensure shape.
    // The class shape matches the interface shape.
    await db.inspectionTasks.add({ ...newTask })
  }

  async getTasksByArea(areaId: string): Promise<InspectionTask[]> {
    const tasks = await db.inspectionTasks.where('areaId').equals(areaId).toArray()
    return tasks.map(
      (t) =>
        new InspectionTask(
          t.id,
          t.title,
          t.areaId,
          t.equipmentId,
          t.status,
          t.createdAt,
          t.updatedAt,
          t.description
        )
    )
  }

  async getAllTasks(): Promise<InspectionTask[]> {
    const tasks = await db.inspectionTasks.toArray()
    return tasks.map(
      (t) =>
        new InspectionTask(
          t.id,
          t.title,
          t.areaId,
          t.equipmentId,
          t.status,
          t.createdAt,
          t.updatedAt,
          t.description
        )
    )
  }

  async getTaskById(id: string): Promise<InspectionTask | undefined> {
    const task = await db.inspectionTasks.get(id)
    if (!task) return undefined
    return new InspectionTask(
      task.id,
      task.title,
      task.areaId,
      task.equipmentId,
      task.status,
      task.createdAt,
      task.updatedAt,
      task.description
    )
  }

  async submitResult(result: Omit<InspectionResult, 'id' | 'createdAt'>): Promise<void> {
    const now = Date.now()
    const newResult = new InspectionResult(
      uuidv4(),
      result.taskId,
      result.verdict,
      result.evidenceIds,
      now,
      result.createdBy,
      result.note
    )
    await db.inspectionResults.add({ ...newResult })

    // Update task status
    await db.inspectionTasks.update(result.taskId, {
      status: 'in_review',
      updatedAt: now,
    })
  }

  async saveEvidence(evidence: Omit<Evidence, 'id' | 'createdAt'>): Promise<string> {
    const now = Date.now()
    const id = uuidv4()
    const newEvidence = new Evidence(
      id,
      evidence.resultId,
      evidence.type,
      evidence.data,
      evidence.mimeType,
      now
    )
    await db.evidences.add({ ...newEvidence })
    return id
  }

  async getEvidencesByResultId(resultId: string): Promise<Evidence[]> {
    const evidences = await db.evidences.where('resultId').equals(resultId).toArray()
    return evidences.map(
      (e) => new Evidence(e.id, e.resultId, e.type, e.data, e.mimeType, e.createdAt)
    )
  }

  async getResultsByTaskId(taskId: string): Promise<InspectionResult[]> {
    const results = await db.inspectionResults.where('taskId').equals(taskId).toArray()
    return results.map(
      (r) =>
        new InspectionResult(
          r.id,
          r.taskId,
          r.verdict,
          r.evidenceIds,
          r.createdAt,
          r.createdBy,
          r.note
        )
    )
  }

  async addComment(comment: Omit<InspectionComment, 'id' | 'createdAt'>): Promise<void> {
    const now = Date.now()
    const newComment = new InspectionComment(
      uuidv4(),
      comment.taskId,
      comment.content,
      now,
      comment.createdBy,
      comment.isSystemComment
    )
    await db.inspectionComments.add({ ...newComment })
  }

  async getCommentsByTaskId(taskId: string): Promise<InspectionComment[]> {
    const comments = await db.inspectionComments.where('taskId').equals(taskId).toArray()
    return comments.map(
      (c) =>
        new InspectionComment(
          c.id,
          c.taskId,
          c.content,
          c.createdAt,
          c.createdBy,
          c.isSystemComment
        )
    )
  }

  async updateTaskStatus(taskId: string, status: InspectionStatus): Promise<void> {
    await db.inspectionTasks.update(taskId, {
      status,
      updatedAt: Date.now(),
    })
  }
}

export const inspectionRepository = new InspectionRepositoryImpl()
