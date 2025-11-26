import type { IDesktopInspectionRepository } from '@/domain/repositories'
import type { InspectionStatus, InspectionVerdict } from '@/domain/types/inspection'
import {
  Area,
  Equipment,
  Inspection,
  InspectionItem,
  InspectionResult,
  Evidence,
  InspectionComment,
} from '@/domain/entities'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

/**
 * バックエンドAPIのレスポンス型
 */
interface ApiArea {
  id: string
  name: string
}

interface ApiEquipment {
  id: string
  name: string
  areaId: string
}

interface ApiInspection {
  id: string
  title: string
  status: string
  description?: string
  createdAt: string
  updatedAt: string
}

interface ApiInspectionItem {
  id: string
  inspectionId: string
  title: string
  description?: string
  areaId: string
  equipmentId: string
  status: string
  createdAt: string
  updatedAt: string
}

interface ApiInspectionResult {
  id: string
  inspectionItemId: string
  verdict: string
  note?: string
  evidenceIds: string[]
  createdBy: string
  createdAt: string
}

interface ApiInspectionComment {
  id: string
  inspectionItemId: string
  content: string
  createdBy: string
  isSystemComment?: boolean
  createdAt: string
}

interface ApiEvidence {
  id: string
  resultId: string
  type: string
  filePath?: string
  mimeType: string
  fileSize: number
  thumbnailPath?: string
  s3Key?: string
  createdAt: string
}

/**
 * ステータスをフロントエンド形式に変換
 */
const mapStatusFromBackend = (status: string): InspectionStatus => {
  const mapping: Record<string, InspectionStatus> = {
    TODO: 'todo',
    IN_REVIEW: 'in_review',
    DONE: 'done',
    CORRECTION_NEEDED: 'correction_needed',
  }
  return mapping[status] || 'todo'
}

/**
 * ステータスをバックエンド形式に変換
 */
const mapStatusToBackend = (status: InspectionStatus): string => {
  const mapping: Record<InspectionStatus, string> = {
    todo: 'TODO',
    in_review: 'IN_REVIEW',
    done: 'DONE',
    correction_needed: 'CORRECTION_NEEDED',
  }
  return mapping[status]
}

/**
 * verdictをフロントエンド形式に変換
 */
const mapVerdictFromBackend = (verdict: string): InspectionVerdict => {
  const mapping: Record<string, InspectionVerdict> = {
    OK: 'ok',
    NG: 'ng',
    N_A: 'n_a',
  }
  return mapping[verdict] || 'ok'
}

/**
 * Desktop用検査リポジトリ実装
 *
 * DesktopアプリはオンラインのみでIndexedDBを使用しないため、
 * API経由でデータを取得・更新します。
 */
export class DesktopInspectionRepositoryImpl implements IDesktopInspectionRepository {
  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // ============ Master Data ============

  async getAreas(): Promise<Area[]> {
    const data = await this.fetch<ApiArea[]>('/master/areas')
    return data.map((a) => new Area(a.id, a.name))
  }

  async getEquipments(areaId: string): Promise<Equipment[]> {
    const data = await this.fetch<ApiEquipment[]>(`/master/equipments/${areaId}`)
    return data.map((e) => new Equipment(e.id, e.name, e.areaId))
  }

  async getAllEquipments(): Promise<Equipment[]> {
    const data = await this.fetch<ApiEquipment[]>('/master/equipments/all')
    return data.map((e) => new Equipment(e.id, e.name, e.areaId))
  }

  // ============ Inspections ============

  async getAllInspections(): Promise<Inspection[]> {
    const data = await this.fetch<ApiInspection[]>('/inspections')
    return data.map(
      (i) =>
        new Inspection(
          i.id,
          i.title,
          mapStatusFromBackend(i.status),
          new Date(i.createdAt).getTime(),
          new Date(i.updatedAt).getTime(),
          i.description
        )
    )
  }

  async getInspectionById(id: string): Promise<Inspection | undefined> {
    try {
      const data = await this.fetch<ApiInspection>(`/inspections/${id}`)
      return new Inspection(
        data.id,
        data.title,
        mapStatusFromBackend(data.status),
        new Date(data.createdAt).getTime(),
        new Date(data.updatedAt).getTime(),
        data.description
      )
    } catch {
      return undefined
    }
  }

  // ============ Inspection Items (Tasks) ============

  async getAllItems(): Promise<InspectionItem[]> {
    const data = await this.fetch<ApiInspectionItem[]>('/inspections/items')
    return data.map(
      (i) =>
        new InspectionItem(
          i.id,
          i.inspectionId,
          i.title,
          i.areaId,
          i.equipmentId,
          mapStatusFromBackend(i.status),
          new Date(i.createdAt).getTime(),
          new Date(i.updatedAt).getTime(),
          i.description
        )
    )
  }

  async getItemsByInspectionId(inspectionId: string): Promise<InspectionItem[]> {
    const data = await this.fetch<ApiInspectionItem[]>(`/inspections/${inspectionId}/items`)
    return data.map(
      (i) =>
        new InspectionItem(
          i.id,
          i.inspectionId,
          i.title,
          i.areaId,
          i.equipmentId,
          mapStatusFromBackend(i.status),
          new Date(i.createdAt).getTime(),
          new Date(i.updatedAt).getTime(),
          i.description
        )
    )
  }

  async getItemById(id: string): Promise<InspectionItem | undefined> {
    try {
      const data = await this.fetch<ApiInspectionItem>(`/inspections/items/${id}`)
      return new InspectionItem(
        data.id,
        data.inspectionId,
        data.title,
        data.areaId,
        data.equipmentId,
        mapStatusFromBackend(data.status),
        new Date(data.createdAt).getTime(),
        new Date(data.updatedAt).getTime(),
        data.description
      )
    } catch {
      return undefined
    }
  }

  async createTask(task: {
    title: string
    description?: string
    areaId: string
    equipmentId: string
    status: InspectionStatus
    inspectionId?: string
  }): Promise<string> {
    const response = await this.fetch<{ id: string }>('/inspections/items', {
      method: 'POST',
      body: JSON.stringify({
        ...task,
        status: mapStatusToBackend(task.status),
      }),
    })
    return response.id
  }

  async updateItemStatus(itemId: string, status: InspectionStatus): Promise<void> {
    await this.fetch(`/inspections/items/${itemId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: mapStatusToBackend(status) }),
    })
  }

  // ============ Results ============

  async getResultsByItemId(itemId: string): Promise<InspectionResult[]> {
    const data = await this.fetch<ApiInspectionResult[]>(
      `/inspections/items/${itemId}/results`
    )
    return data.map(
      (r) =>
        new InspectionResult(
          r.id,
          r.inspectionItemId,
          mapVerdictFromBackend(r.verdict),
          r.evidenceIds,
          new Date(r.createdAt).getTime(),
          r.createdBy,
          r.note
        )
    )
  }

  async getLatestResultsByItemIds(itemIds: string[]): Promise<Map<string, InspectionResult>> {
    const results = new Map<string, InspectionResult>()

    for (const itemId of itemIds) {
      try {
        const itemResults = await this.getResultsByItemId(itemId)
        if (itemResults.length > 0) {
          // 最新の結果を取得（createdAtでソート）
          const sorted = [...itemResults].sort((a, b) => b.createdAt - a.createdAt)
          results.set(itemId, sorted[0])
        }
      } catch {
        // エラーは無視
      }
    }

    return results
  }

  // ============ Comments ============

  async getCommentsByItemId(itemId: string): Promise<InspectionComment[]> {
    const data = await this.fetch<ApiInspectionComment[]>(
      `/inspections/items/${itemId}/comments`
    )
    return data.map(
      (c) =>
        new InspectionComment(
          c.id,
          c.inspectionItemId,
          c.content,
          new Date(c.createdAt).getTime(),
          c.createdBy,
          c.isSystemComment
        )
    )
  }

  async addComment(comment: Omit<InspectionComment, 'id' | 'createdAt'>): Promise<void> {
    await this.fetch('/inspections/comments', {
      method: 'POST',
      body: JSON.stringify({
        inspectionItemId: comment.inspectionItemId,
        content: comment.content,
        createdBy: comment.createdBy,
        isSystemComment: comment.isSystemComment,
      }),
    })
  }

  // ============ Evidences ============

  async getEvidencesByResultId(resultId: string): Promise<Evidence[]> {
    const data = await this.fetch<ApiEvidence[]>(`/inspections/results/${resultId}/evidences`)
    return data.map(
      (e) =>
        new Evidence(
          e.id,
          e.resultId,
          e.type as 'image' | 'video',
          e.s3Key || e.filePath || '',
          e.mimeType,
          new Date(e.createdAt).getTime(),
          e.fileSize,
          e.thumbnailPath
        )
    )
  }
}

export const desktopInspectionRepository = new DesktopInspectionRepositoryImpl()
