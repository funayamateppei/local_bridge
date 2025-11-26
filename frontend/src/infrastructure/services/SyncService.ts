import { db } from '@/infrastructure/db'
import { opfsStorage } from '@/infrastructure/storage/opfs'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

export class SyncService {
  /**
   * マスターデータを同期（サーバー → ローカル）
   */
  async syncMasterData(): Promise<void> {
    try {
      // Areas
      const areasResponse = await fetch(`${API_BASE_URL}/master/areas`)
      if (!areasResponse.ok) throw new Error('Failed to fetch areas')
      const areas = await areasResponse.json()

      // ローカルDBを更新（既存データを削除して再作成）
      await db.areas.clear()
      await db.areas.bulkAdd(areas)

      // Equipments
      const equipmentsResponse = await fetch(`${API_BASE_URL}/master/equipments/all`)
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
   * ローカルの変更をサーバーに送信
   */
  async pushLocalChanges(): Promise<void> {
    try {
      await this.pushInspections()
      await this.pushInspectionItems()
      await this.pushResults()
      await this.pushComments()
      await this.pushEvidences()

      console.log('Local changes pushed successfully')
    } catch (error) {
      console.error('Failed to push local changes:', error)
      throw error
    }
  }

  private async pushInspections(): Promise<void> {
    const inspections = await db.inspections.toArray()

    for (const inspection of inspections) {
      try {
        const response = await fetch(`${API_BASE_URL}/inspections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: inspection.id,
            title: inspection.title,
            status: this.mapStatusToBackend(inspection.status),
            description: inspection.description,
            createdAt: inspection.createdAt,
            updatedAt: inspection.updatedAt,
          }),
        })

        if (!response.ok && response.status !== 409) {
          // 409 Conflict は既に存在する場合なので無視
          throw new Error(`Failed to push inspection ${inspection.id}`)
        }
      } catch (error) {
        console.error(`Error pushing inspection ${inspection.id}:`, error)
        // 個別のエラーは記録するが、全体の同期は続行
      }
    }
  }

  private async pushInspectionItems(): Promise<void> {
    const items = await db.inspectionItems.toArray()

    for (const item of items) {
      try {
        const response = await fetch(`${API_BASE_URL}/inspections/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: item.id,
            inspectionId: item.inspectionId,
            title: item.title,
            description: item.description,
            areaId: item.areaId,
            equipmentId: item.equipmentId,
            status: this.mapStatusToBackend(item.status),
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          }),
        })

        if (!response.ok && response.status !== 409) {
          throw new Error(`Failed to push inspection item ${item.id}`)
        }
      } catch (error) {
        console.error(`Error pushing inspection item ${item.id}:`, error)
      }
    }
  }

  private async pushResults(): Promise<void> {
    const results = await db.inspectionResults.toArray()

    for (const result of results) {
      try {
        const response = await fetch(`${API_BASE_URL}/inspections/results`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: result.id,
            inspectionItemId: result.inspectionItemId,
            verdict: this.mapVerdictToBackend(result.verdict),
            note: result.note,
            evidenceIds: result.evidenceIds,
            createdBy: result.createdBy,
            createdAt: result.createdAt,
          }),
        })

        if (!response.ok && response.status !== 409) {
          throw new Error(`Failed to push result ${result.id}`)
        }
      } catch (error) {
        console.error(`Error pushing result ${result.id}:`, error)
      }
    }
  }

  private async pushComments(): Promise<void> {
    const comments = await db.inspectionComments.toArray()

    for (const comment of comments) {
      try {
        const response = await fetch(`${API_BASE_URL}/inspections/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: comment.id,
            inspectionItemId: comment.inspectionItemId,
            content: comment.content,
            createdBy: comment.createdBy,
            isSystemComment: comment.isSystemComment,
            createdAt: comment.createdAt,
          }),
        })

        if (!response.ok && response.status !== 409) {
          throw new Error(`Failed to push comment ${comment.id}`)
        }
      } catch (error) {
        console.error(`Error pushing comment ${comment.id}:`, error)
      }
    }
  }

  private async pushEvidences(): Promise<void> {
    const evidences = await db.evidences.toArray()

    for (const evidence of evidences) {
      try {
        // TODO: S3 Presigned URL取得とアップロード実装
        // 現在はメタデータのみ送信
        const response = await fetch(`${API_BASE_URL}/inspections/evidences`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: evidence.id,
            resultId: evidence.resultId,
            type: this.mapEvidenceTypeToBackend(evidence.type),
            filePath: evidence.filePath,
            mimeType: evidence.mimeType,
            fileSize: evidence.fileSize,
            thumbnailPath: evidence.thumbnailPath,
            s3Key: null, // TODO: S3アップロード後に設定
            createdAt: evidence.createdAt,
          }),
        })

        if (!response.ok && response.status !== 409) {
          throw new Error(`Failed to push evidence ${evidence.id}`)
        }
      } catch (error) {
        console.error(`Error pushing evidence ${evidence.id}:`, error)
      }
    }
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
  async fullSync(): Promise<void> {
    // マスターデータを取得
    await this.syncMasterData()

    // ローカルの変更を送信
    await this.pushLocalChanges()
  }
}

export const syncService = new SyncService()
