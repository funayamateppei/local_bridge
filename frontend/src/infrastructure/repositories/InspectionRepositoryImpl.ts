import { db } from '@/infrastructure/db'
import type { IInspectionRepository } from '@/domain/repositories/InspectionRepository'
import {
  Area,
  Equipment,
  Inspection,
  InspectionItem,
  InspectionResult,
  Evidence,
  InspectionComment,
} from '@/domain/entities'
import type { InspectionStatus } from '@/domain/types/inspection'
import { v4 as uuidv4 } from 'uuid'
import { opfsStorage } from '@/infrastructure/storage/opfs'

export class InspectionRepositoryImpl implements IInspectionRepository {
  // Master Data
  async getAreas(): Promise<Area[]> {
    const areas = await db.areas.toArray()
    return areas.map((a) => new Area(a.id, a.name))
  }

  async getEquipments(areaId: string): Promise<Equipment[]> {
    const equipments = await db.equipments.where('areaId').equals(areaId).toArray()
    return equipments.map((e) => new Equipment(e.id, e.name, e.areaId))
  }

  // Inspection
  async createInspection(
    inspection: Omit<Inspection, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const now = Date.now()
    const id = uuidv4()
    const newInspection = new Inspection(
      id,
      inspection.title,
      inspection.status,
      now,
      now,
      inspection.description
    )
    await db.inspections.add({ ...newInspection })
    return id
  }

  async getAllInspections(): Promise<Inspection[]> {
    const inspections = await db.inspections.toArray()
    return inspections.map(
      (i) => new Inspection(i.id, i.title, i.status, i.createdAt, i.updatedAt, i.description)
    )
  }

  async getInspectionById(id: string): Promise<Inspection | undefined> {
    const inspection = await db.inspections.get(id)
    if (!inspection) return undefined
    return new Inspection(
      inspection.id,
      inspection.title,
      inspection.status,
      inspection.createdAt,
      inspection.updatedAt,
      inspection.description
    )
  }

  // InspectionItem
  async createInspectionItem(
    item: Omit<InspectionItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    const now = Date.now()
    const newItem = new InspectionItem(
      uuidv4(),
      item.inspectionId,
      item.title,
      item.areaId,
      item.equipmentId,
      item.status,
      now,
      now,
      item.description
    )
    await db.inspectionItems.add({ ...newItem })
  }

  async getItemsByInspectionId(inspectionId: string): Promise<InspectionItem[]> {
    const items = await db.inspectionItems.where('inspectionId').equals(inspectionId).toArray()
    return items.map(
      (i) =>
        new InspectionItem(
          i.id,
          i.inspectionId,
          i.title,
          i.areaId,
          i.equipmentId,
          i.status,
          i.createdAt,
          i.updatedAt,
          i.description
        )
    )
  }

  async getAllItems(): Promise<InspectionItem[]> {
    const items = await db.inspectionItems.toArray()
    return items.map(
      (i) =>
        new InspectionItem(
          i.id,
          i.inspectionId,
          i.title,
          i.areaId,
          i.equipmentId,
          i.status,
          i.createdAt,
          i.updatedAt,
          i.description
        )
    )
  }

  async getItemById(id: string): Promise<InspectionItem | undefined> {
    const item = await db.inspectionItems.get(id)
    if (!item) return undefined
    return new InspectionItem(
      item.id,
      item.inspectionId,
      item.title,
      item.areaId,
      item.equipmentId,
      item.status,
      item.createdAt,
      item.updatedAt,
      item.description
    )
  }

  // Result & Evidence
  async submitResult(result: Omit<InspectionResult, 'id' | 'createdAt'>): Promise<void> {
    const now = Date.now()
    const newResult = new InspectionResult(
      uuidv4(),
      result.inspectionItemId,
      result.verdict,
      result.evidenceIds,
      now,
      result.createdBy,
      result.note
    )
    await db.inspectionResults.add({ ...newResult })

    // Update item status
    await db.inspectionItems.update(result.inspectionItemId, {
      status: 'in_review',
      updatedAt: now,
    })
  }

  async saveEvidence(
    evidence: Omit<Evidence, 'id' | 'createdAt' | 'filePath'>,
    file: Blob
  ): Promise<string> {
    const now = Date.now()
    const id = uuidv4()

    // ファイル拡張子を取得
    const ext = evidence.mimeType.split('/')[1] || 'bin'
    const filePath = `/evidence/${id}.${ext}`

    // OPFSにファイルを保存
    await opfsStorage.saveFile(filePath, file)

    // メタデータをIndexedDBに保存
    const newEvidence = new Evidence(
      id,
      evidence.resultId,
      evidence.type,
      filePath,
      evidence.mimeType,
      now,
      file.size,
      undefined // thumbnailPath は後で実装
    )
    await db.evidences.add({ ...newEvidence })
    return id
  }

  async getEvidencesByResultId(resultId: string): Promise<Evidence[]> {
    const evidences = await db.evidences.where('resultId').equals(resultId).toArray()
    return evidences.map(
      (e) =>
        new Evidence(
          e.id,
          e.resultId,
          e.type,
          e.filePath,
          e.mimeType,
          e.createdAt,
          e.fileSize,
          e.thumbnailPath
        )
    )
  }

  async getResultsByItemId(itemId: string): Promise<InspectionResult[]> {
    const results = await db.inspectionResults.where('inspectionItemId').equals(itemId).toArray()
    return results.map(
      (r) =>
        new InspectionResult(
          r.id,
          r.inspectionItemId,
          r.verdict,
          r.evidenceIds,
          r.createdAt,
          r.createdBy,
          r.note
        )
    )
  }

  // Comment
  async addComment(comment: Omit<InspectionComment, 'id' | 'createdAt'>): Promise<void> {
    const now = Date.now()
    const newComment = new InspectionComment(
      uuidv4(),
      comment.inspectionItemId,
      comment.content,
      now,
      comment.createdBy,
      comment.isSystemComment
    )
    await db.inspectionComments.add({ ...newComment })
  }

  async getCommentsByItemId(itemId: string): Promise<InspectionComment[]> {
    const comments = await db.inspectionComments.where('inspectionItemId').equals(itemId).toArray()
    return comments.map(
      (c) =>
        new InspectionComment(
          c.id,
          c.inspectionItemId,
          c.content,
          c.createdAt,
          c.createdBy,
          c.isSystemComment
        )
    )
  }

  // Status Update
  async updateItemStatus(itemId: string, status: InspectionStatus): Promise<void> {
    await db.inspectionItems.update(itemId, {
      status,
      updatedAt: Date.now(),
    })
  }

  async updateInspectionStatus(inspectionId: string, status: InspectionStatus): Promise<void> {
    await db.inspections.update(inspectionId, {
      status,
      updatedAt: Date.now(),
    })
  }
}

export const inspectionRepository = new InspectionRepositoryImpl()
