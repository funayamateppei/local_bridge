import { db, type Command, type CommandType } from '@/infrastructure/db'
import { commandService } from '@/infrastructure/services/CommandService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

export interface SyncResult {
  success: boolean
  syncedCount: number
  failedCount: number
  errors: string[]
}

export type SyncProgressCallback = (current: number, total: number, message: string) => void

// Command実行順序を定義（依存関係を考慮）
const COMMAND_EXECUTION_ORDER: CommandType[] = [
  'CREATE_INSPECTION',
  'UPDATE_INSPECTION_STATUS',
  'CREATE_INSPECTION_ITEM',
  'UPDATE_INSPECTION_ITEM_STATUS',
  'CREATE_RESULT',
  'CREATE_COMMENT',
  'CREATE_EVIDENCE',
]

export class SyncService {
  /**
   * マスターデータを同期(サーバー → ローカル)
   */
  async syncMasterData(): Promise<void> {
    try {
      // 最後の同期タイムスタンプを取得
      const lastSyncSetting = await db.settings.get('last_master_sync_at')
      const lastSyncAt = lastSyncSetting?.value as number | undefined

      // Areas - 差分取得
      const areasUrl = lastSyncAt
        ? `${API_BASE_URL}/master/areas?since=${lastSyncAt}`
        : `${API_BASE_URL}/master/areas`

      const areasResponse = await this.fetchWithAuth(areasUrl)
      if (!areasResponse.ok) throw new Error('Failed to fetch areas')
      const areas = await areasResponse.json()

      // ローカルDBを更新
      if (lastSyncAt && areas.length > 0) {
        // 差分更新: 既存データをマージ
        await db.areas.bulkPut(areas)
      } else if (!lastSyncAt) {
        // 初回同期: 全件置き換え
        await db.areas.clear()
        await db.areas.bulkAdd(areas)
      }

      // Equipments - 差分取得
      const equipmentsUrl = lastSyncAt
        ? `${API_BASE_URL}/master/equipments/all?since=${lastSyncAt}`
        : `${API_BASE_URL}/master/equipments/all`

      const equipmentsResponse = await this.fetchWithAuth(equipmentsUrl)
      if (!equipmentsResponse.ok) throw new Error('Failed to fetch equipments')
      const equipments = await equipmentsResponse.json()

      // ローカルDBを更新
      if (lastSyncAt && equipments.length > 0) {
        // 差分更新: 既存データをマージ
        await db.equipments.bulkPut(equipments)
      } else if (!lastSyncAt) {
        // 初回同期: 全件置き換え
        await db.equipments.clear()
        await db.equipments.bulkAdd(equipments)
      }

      // 同期タイムスタンプを保存
      await db.settings.put({
        key: 'last_master_sync_at',
        value: Date.now(),
      })

      console.log('Master data synced successfully')
    } catch (error) {
      console.error('Failed to sync master data:', error)
      throw error
    }
  }

  /**
   * Commandキューに基づいてローカルの操作をサーバーに反映
   * Command方式: 操作ログを順番に実行するだけ（順序管理不要）
   */
  async pushLocalChanges(onProgress?: SyncProgressCallback): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: [],
    }

    try {
      // 全体の未実行Command数を取得
      const totalCount = await commandService.getPendingCount()
      let processedCount = 0

      // Command種別ごとに実行（依存関係順）
      for (const commandType of COMMAND_EXECUTION_ORDER) {
        await this.executeCommandsByType(commandType, result, (count) => {
          processedCount += count
          onProgress?.(processedCount, totalCount, this.getProgressMessage(commandType))
        })
      }

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
   * 進捗メッセージを取得
   */
  private getProgressMessage(type: CommandType): string {
    const messages: Record<CommandType, string> = {
      CREATE_INSPECTION: '検査データを作成中...',
      UPDATE_INSPECTION_STATUS: '検査ステータスを更新中...',
      CREATE_INSPECTION_ITEM: '検査項目を作成中...',
      UPDATE_INSPECTION_ITEM_STATUS: '項目ステータスを更新中...',
      CREATE_RESULT: '結果を登録中...',
      CREATE_COMMENT: 'コメントを追加中...',
      CREATE_EVIDENCE: 'エビデンスをアップロード中...',
    }
    return messages[type] || '同期中...'
  }

  /**
   * 特定タイプのCommandを実行
   */
  private async executeCommandsByType(
    type: CommandType,
    result: SyncResult,
    onItemProcessed?: (count: number) => void
  ): Promise<void> {
    const commands = await commandService.getPendingCommandsByType(type)

    for (const command of commands) {
      try {
        await commandService.updateStatus(command.id, 'executing')
        await this.executeCommand(command)
        await commandService.markAsExecuted(command.id)
        result.syncedCount++
        onItemProcessed?.(1)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        await commandService.updateStatus(command.id, 'failed', errorMessage)
        result.failedCount++
        result.errors.push(`${type}: ${errorMessage}`)
        console.error(`Error executing ${type}:`, error)
        onItemProcessed?.(1)
      }
    }
  }

  /**
   * 単一のCommandを実行
   */
  private async executeCommand(command: Command): Promise<void> {
    const payload = command.payload as Record<string, unknown>

    switch (command.type) {
      case 'CREATE_INSPECTION':
        await this.pushInspection(payload)
        break
      case 'UPDATE_INSPECTION_STATUS':
        await this.pushInspectionStatusUpdate(payload)
        break
      case 'CREATE_INSPECTION_ITEM':
        await this.pushInspectionItem(payload)
        break
      case 'UPDATE_INSPECTION_ITEM_STATUS':
        await this.pushInspectionItemStatusUpdate(payload)
        break
      case 'CREATE_RESULT':
        await this.pushResult(payload)
        break
      case 'CREATE_COMMENT':
        await this.pushComment(payload)
        break
      case 'CREATE_EVIDENCE':
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
        createdAt: payload.createdAt, // ISO 8601 UTC形式（ローカルで発行済み）
        updatedAt: payload.updatedAt,
      }),
    })

    if (!response.ok && response.status !== 409) {
      throw new Error(`Failed to push inspection ${payload.id}`)
    }
  }

  private async pushInspectionStatusUpdate(payload: Record<string, unknown>): Promise<void> {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/inspections/${payload.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: this.mapStatusToBackend(payload.status as string),
        updatedAt: payload.updatedAt, // ISO 8601 UTC形式（ローカルで発行済み）
      }),
    })

    if (!response.ok && response.status !== 409) {
      throw new Error(`Failed to update inspection status ${payload.id}`)
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
        createdAt: payload.createdAt, // ISO 8601 UTC形式（ローカルで発行済み）
        updatedAt: payload.updatedAt,
      }),
    })

    if (!response.ok && response.status !== 409) {
      throw new Error(`Failed to push inspection item ${payload.id}`)
    }
  }

  private async pushInspectionItemStatusUpdate(payload: Record<string, unknown>): Promise<void> {
    const response = await this.fetchWithAuth(`${API_BASE_URL}/inspections/items/${payload.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: this.mapStatusToBackend(payload.status as string),
        updatedAt: payload.updatedAt, // ISO 8601 UTC形式（ローカルで発行済み）
      }),
    })

    if (!response.ok && response.status !== 409) {
      throw new Error(`Failed to update inspection item status ${payload.id}`)
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
        createdAt: payload.createdAt, // ISO 8601 UTC形式（ローカルで発行済み）
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
        createdAt: payload.createdAt, // ISO 8601 UTC形式（ローカルで発行済み）
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
        createdAt: payload.createdAt, // ISO 8601 UTC形式（ローカルで発行済み）
      }),
    })

    if (!response.ok && response.status !== 409) {
      throw new Error(`Failed to push evidence ${payload.id}`)
    }
  }

  /**
   * 未実行Command数を取得
   */
  async getPendingCount(): Promise<number> {
    return commandService.getPendingCount()
  }

  /**
   * 失敗したCommandをリセット
   */
  async resetFailedItems(): Promise<void> {
    return commandService.resetFailedCommands()
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
  async fullSync(onProgress?: SyncProgressCallback): Promise<SyncResult> {
    // マスターデータを取得
    await this.syncMasterData()

    // ローカルの変更を送信
    return this.pushLocalChanges(onProgress)
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

    // 401 Unauthorized の場合はリフレッシュを試みる
    if (response.status === 401) {
      console.warn('Unauthorized access detected. Trying to refresh token...')

      try {
        const refreshTokenItem = await db.settings.get('refresh_token')
        if (refreshTokenItem && refreshTokenItem.value) {
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: refreshTokenItem.value }),
          })

          if (refreshResponse.ok) {
            const data = await refreshResponse.json()
            await db.settings.put({ key: 'auth_token', value: data.token })
            await db.settings.put({ key: 'refresh_token', value: data.refreshToken })

            // 新しいトークンでリトライ
            headers['Authorization'] = `Bearer ${data.token}`
            return await fetch(url, {
              ...options,
              headers,
            })
          }
        }
      } catch (e) {
        console.error('Failed to refresh token during sync:', e)
      }

      // リフレッシュ失敗時はログアウト
      console.warn('Refresh failed. Clearing token and reloading.')
      await db.settings.delete('auth_token')
      await db.settings.delete('refresh_token')
      window.location.reload()
      throw new Error('Unauthorized')
    }

    return response
  }
}

export const syncService = new SyncService()
