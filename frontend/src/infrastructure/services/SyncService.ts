import { db, type SyncQueueItem } from '@/infrastructure/db'
import { syncQueueService } from '@/infrastructure/services/SyncQueueService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

export interface SyncResult {
  success: boolean
  syncedCount: number
  failedCount: number
  errors: string[]
}

export class SyncService {
  /**
   * マスターデータを同期（サーバー → ローカル）
   */
  async syncMasterData(): Promise<void> {
    try {
      // Areas
      const areasResponse = await this.fetchWithAuth(`${API_BASE_URL}/master/areas`)
      if (!areasResponse.ok) throw new Error('Failed to fetch areas')
      const areas = await areasResponse.json()

      // ローカルDBを更新（既存データを削除して再作成）
      await db.areas.clear()
      await db.areas.bulkAdd(areas)

      // Equipments
      const equipmentsResponse = await this.fetchWithAuth(`${API_BASE_URL}/master/equipments/all`)
      if (!equipmentsResponse.ok) throw new Error('Failed to fetch equipments')
      const equipments = await equipmentsResponse.json()

      await db.equipments.clear()
      await db.equipments.bulkAdd(equipments)

      console.log('Master data synced successfully')
    } catch (error) {
      console.error('Failed to sync master data:', error)
      throw error
    }
  }

  /**
   * 同期キューに基づいてローカルの変更をサーバーに送信
   */
  async pushLocalChanges(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: [],
    }

    try {
      // 同期順序: inspection → inspectionItem → result → comment → evidence
      await this.pushQueuedItems('inspection', result)
      await this.pushQueuedItems('inspectionItem', result)
      await this.pushQueuedItems('result', result)
      await this.pushQueuedItems('comment', result)
      await this.pushQueuedItems('evidence', result)

      console.log(`Sync completed: ${result.syncedCount} synced, ${result.failedCount} failed`)
    } catch (error) {
      console.error('Failed to push local changes:', error)
      result.success = false
      result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    }

    result.success = result.failedCount === 0
    return result
  }

  /**
   * 特定タイプのキューアイテムを同期
   */
  private async pushQueuedItems(type: SyncQueueItem['type'], result: SyncResult): Promise<void> {
    const items = await syncQueueService.getPendingItemsByType(type)

    for (const item of items) {
      try {
        await syncQueueService.updateStatus(item.id, 'syncing')
        await this.pushSingleItem(item)
        await syncQueueService.markAsSynced(item.id)
        result.syncedCount++
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        await syncQueueService.updateStatus(item.id, 'failed', errorMessage)
        result.failedCount++
        result.errors.push(`${type}[${item.entityId}]: ${errorMessage}`)
        console.error(`Error pushing ${type} ${item.entityId}:`, error)
      }
    }
  }

  /**
   * 単一のキューアイテムを同期
   */
  private async pushSingleItem(item: SyncQueueItem): Promise<void> {
    const payload = item.payload as Record<string, unknown>

    switch (item.type) {
      case 'inspection':
        await this.pushInspection(payload)
        break
      case 'inspectionItem':
        await this.pushInspectionItem(payload)
        break
      case 'result':
        await this.pushResult(payload)
        break
      case 'comment':
        await this.pushComment(payload)
        break
      case 'evidence':
        await this.pushEvidence(payload)
        break
    }
  }

  private async pushInspection(payload: Record<string, unknown>): Promise<void> {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/inspections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: payload.id,
        title: payload.title,
        status: this.mapStatusToBackend(payload.status as string),
        description: payload.description,
        createdAt: payload.createdAt,
        updatedAt: payload.updatedAt,
      }),
    })

    if (!response.ok && response.status !== 409) {
      throw new Error(`Failed to push inspection ${payload.id}`)
    }
  }

  private async pushInspectionItem(payload: Record<string, unknown>): Promise<void> {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/inspections/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: payload.id,
        inspectionId: payload.inspectionId,
        title: payload.title,
        description: payload.description,
        areaId: payload.areaId,
        equipmentId: payload.equipmentId,
        status: this.mapStatusToBackend(payload.status as string),
        createdAt: payload.createdAt,
        updatedAt: payload.updatedAt,
      }),
    })

    if (!response.ok && response.status !== 409) {
      throw new Error(`Failed to push inspection item ${payload.id}`)
    }
  }

  private async pushResult(payload: Record<string, unknown>): Promise<void> {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/inspections/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: payload.id,
        inspectionItemId: payload.inspectionItemId,
        verdict: this.mapVerdictToBackend(payload.verdict as string),
        note: payload.note,
        evidenceIds: payload.evidenceIds,
        createdBy: payload.createdBy,
        createdAt: payload.createdAt,
      }),
    })

    if (!response.ok && response.status !== 409) {
      throw new Error(`Failed to push result ${payload.id}`)
    }
  }

  private async pushComment(payload: Record<string, unknown>): Promise<void> {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/inspections/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: payload.id,
        inspectionItemId: payload.inspectionItemId,
        content: payload.content,
        createdBy: payload.createdBy,
        isSystemComment: payload.isSystemComment,
        createdAt: payload.createdAt,
      }),
    })

    if (!response.ok && response.status !== 409) {
      throw new Error(`Failed to push comment ${payload.id}`)
    }
  }

  private async pushEvidence(payload: Record<string, unknown>): Promise<void> {
    // TODO: S3 Presigned URL取得とアップロード実装
    // 現在はメタデータのみ送信
    const response = await this.fetchWithAuth(`${API_BASE_URL}/inspections/evidences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: payload.id,
        resultId: payload.resultId,
        type: this.mapEvidenceTypeToBackend(payload.type as string),
        filePath: payload.filePath,
        mimeType: payload.mimeType,
        fileSize: payload.fileSize,
        thumbnailPath: payload.thumbnailPath,
        s3Key: null, // TODO: S3アップロード後に設定
        createdAt: payload.createdAt,
      }),
    })

    if (!response.ok && response.status !== 409) {
      throw new Error(`Failed to push evidence ${payload.id}`)
    }
  }

  /**
   * 未同期アイテム数を取得
   */
  async getPendingCount(): Promise<number> {
    return syncQueueService.getPendingCount()
  }

  /**
   * 失敗したアイテムをリセット
   */
  async resetFailedItems(): Promise<void> {
    return syncQueueService.resetFailedItems()
  }

  /**
   * フロントエンドのステータスをバックエンド形式に変換
   */
  private mapStatusToBackend(status: string): string {
    const mapping: Record<string, string> = {
      todo: 'TODO',
      in_review: 'IN_REVIEW',
      done: 'DONE',
      correction_needed: 'CORRECTION_NEEDED',
    }
    return mapping[status] || status.toUpperCase()
  }

  /**
   * フロントエンドのverdictをバックエンド形式に変換
   */
  private mapVerdictToBackend(verdict: string): string {
    const mapping: Record<string, string> = {
      ok: 'OK',
      ng: 'NG',
      n_a: 'N_A',
    }
    return mapping[verdict] || verdict.toUpperCase()
  }

  /**
   * フロントエンドのevidenceTypeをバックエンド形式に変換
   */
  private mapEvidenceTypeToBackend(type: string): string {
    return type.toUpperCase()
  }

  /**
   * 完全同期を実行
   */
  async fullSync(): Promise<SyncResult> {
    // マスターデータを取得
    await this.syncMasterData()

    // ローカルの変更を送信
    return this.pushLocalChanges()
  }
  /**
   * 認証付きのフェッチを実行
   */
  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await db.settings.get('auth_token')
    const headers: Record<string, string> = {}

    // 既存のヘッダーをコピー
    if (options.headers) {
      Object.assign(headers, options.headers)
    }

    // トークンがあればAuthorizationヘッダーを追加
    if (token && token.value) {
      headers['Authorization'] = `Bearer ${token.value}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    // 401 Unauthorized の場合はログアウト処理
    if (response.status === 401) {
      console.warn('Unauthorized access detected. Clearing token and reloading.')
      await db.settings.delete('auth_token')
      window.location.reload()
      throw new Error('Unauthorized')
    }

    return response
  }
}

export const syncService = new SyncService()
