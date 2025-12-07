import { db } from '@/infrastructure/db'
import type { IMobileInspectionRepository } from '@/domain/repositories/MobileInspectionRepository'
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
import { commandService } from '@/infrastructure/services/CommandService'

export class MobileInspectionRepositoryImpl implements IMobileInspectionRepository {
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
    const now = new Date().toISOString() // ローカルでUTC発行
    const id = uuidv4()
    const newInspection = new Inspection(
      id,
      inspection.title,
      inspection.status,
      now,
      now,
      inspection.description
    )
    // 1. 即座にローカルDBに保存（楽観的更新）
    await db.inspections.add({ ...newInspection })

    // 2. Commandを記録（後でサーバーに反映）
    await commandService.recordCommand('CREATE_INSPECTION', { ...newInspection })

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
    const now = new Date().toISOString() // ローカルでUTC発行
    const id = uuidv4()
    const newItem = new InspectionItem(
      id,
      item.inspectionId,
      item.title,
      item.areaId,
      item.equipmentId,
      item.status,
      now,
      now,
      item.description
    )
    // 1. 即座にローカルDBに保存（楽観的更新）
    await db.inspectionItems.add({ ...newItem })

    // 2. Commandを記録（後でサーバーに反映）
    await commandService.recordCommand('CREATE_INSPECTION_ITEM', { ...newItem })
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
    const now = new Date().toISOString() // ローカルでUTC発行
    const id = uuidv4()
    const newResult = new InspectionResult(
      id,
      result.inspectionItemId,
      result.verdict,
      result.evidenceIds,
      now,
      result.createdBy,
      result.note
    )
    // 1. 即座にローカルDBに保存（楽観的更新）
    await db.inspectionResults.add({ ...newResult })

    // 2. Commandを記録（後でサーバーに反映）
    await commandService.recordCommand('CREATE_RESULT', { ...newResult })

    // Update item status
    await db.inspectionItems.update(result.inspectionItemId, {
      status: 'in_review',
      updatedAt: now,
    })

    // Item status update もCommandを記録
    const updatedItem = await db.inspectionItems.get(result.inspectionItemId)
    if (updatedItem) {
      await commandService.recordCommand('UPDATE_INSPECTION_ITEM_STATUS', {
        id: updatedItem.id,
        status: updatedItem.status,
        updatedAt: now,
      })
    }
  }

  async saveEvidence(
    evidence: Omit<Evidence, 'id' | 'createdAt' | 'filePath'>,
    file: Blob
  ): Promise<string> {
    const now = new Date().toISOString() // ローカルでUTC発行
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
    // 1. 即座にローカルDBに保存（楽観的更新）
    await db.evidences.add({ ...newEvidence })

    // 2. Commandを記録（後でサーバーに反映）
    await commandService.recordCommand('CREATE_EVIDENCE', { ...newEvidence })

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

  async getLatestResultsByItemIds(itemIds: string[]): Promise<Map<string, InspectionResult>> {
    const results = await db.inspectionResults.where('inspectionItemId').anyOf(itemIds).toArray()

    const latestResults = new Map<string, InspectionResult>()

    // Group by itemId and find latest
    const grouped = results.reduce(
      (acc, curr) => {
        if (!acc[curr.inspectionItemId] || acc[curr.inspectionItemId].createdAt < curr.createdAt) {
          acc[curr.inspectionItemId] = curr
        }
        return acc
      },
      {} as Record<string, (typeof results)[0]>
    )

    Object.values(grouped).forEach((r) => {
      latestResults.set(
        r.inspectionItemId,
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
    })

    return latestResults
  }

  // Comment
  async addComment(comment: Omit<InspectionComment, 'id' | 'createdAt'>): Promise<void> {
    const now = new Date().toISOString() // ローカルでUTC発行
    const id = uuidv4()
    const newComment = new InspectionComment(
      id,
      comment.inspectionItemId,
      comment.content,
      now,
      comment.createdBy,
      comment.isSystemComment
    )
    // 1. 即座にローカルDBに保存（楽観的更新）
    await db.inspectionComments.add({ ...newComment })

    // 2. Commandを記録（後でサーバーに反映）
    await commandService.recordCommand('CREATE_COMMENT', { ...newComment })
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
    const now = new Date().toISOString() // ローカルでUTC発行
    // 1. 即座にローカルDBに保存（楽観的更新）
    await db.inspectionItems.update(itemId, {
      status,
      updatedAt: now,
    })

    // 2. Commandを記録（後でサーバーに反映）
    await commandService.recordCommand('UPDATE_INSPECTION_ITEM_STATUS', {
      id: itemId,
      status,
      updatedAt: now,
    })
  }

  async updateInspectionStatus(inspectionId: string, status: InspectionStatus): Promise<void> {
    const now = new Date().toISOString() // ローカルでUTC発行
    // 1. 即座にローカルDBに保存（楽観的更新）
    await db.inspections.update(inspectionId, {
      status,
      updatedAt: now,
    })

    // 2. Commandを記録（後でサーバーに反映）
    await commandService.recordCommand('UPDATE_INSPECTION_STATUS', {
      id: inspectionId,
      status,
      updatedAt: now,
    })
  }
}

export const mobileInspectionRepository = new MobileInspectionRepositoryImpl()
