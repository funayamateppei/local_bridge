import { v4 as uuidv4 } from 'uuid'
import { db, type SyncQueueItem, type SyncQueueItemType, type SyncQueueStatus } from '@/infrastructure/db'

const MAX_RETRY_COUNT = 3

export class SyncQueueService {
  /**
   * 同期キューにアイテムを追加
   */
  async enqueue(type: SyncQueueItemType, entityId: string, payload: unknown): Promise<void> {
    // 同じエンティティが既にキューにあるか確認
    const existing = await db.syncQueue
      .where('entityId')
      .equals(entityId)
      .and((item) => item.type === type)
      .first()

    if (existing) {
      // 既存のアイテムを更新（最新のペイロードに置き換え）
      await db.syncQueue.update(existing.id, {
        payload,
        status: 'pending',
        retryCount: 0,
        createdAt: Date.now(),
        errorMessage: undefined,
      })
    } else {
      // 新規追加
      const item: SyncQueueItem = {
        id: uuidv4(),
        type,
        entityId,
        payload,
        status: 'pending',
        retryCount: 0,
        createdAt: Date.now(),
      }
      await db.syncQueue.add(item)
    }
  }

  /**
   * 同期が必要なアイテムを取得（pending または failed で再試行可能なもの）
   */
  async getPendingItems(): Promise<SyncQueueItem[]> {
    return db.syncQueue
      .where('status')
      .anyOf(['pending', 'failed'])
      .and((item) => item.retryCount < MAX_RETRY_COUNT)
      .sortBy('createdAt')
  }

  /**
   * 特定タイプの同期が必要なアイテムを取得
   */
  async getPendingItemsByType(type: SyncQueueItemType): Promise<SyncQueueItem[]> {
    return db.syncQueue
      .where('type')
      .equals(type)
      .and((item) => item.status !== 'syncing' && item.retryCount < MAX_RETRY_COUNT)
      .sortBy('createdAt')
  }

  /**
   * アイテムのステータスを更新
   */
  async updateStatus(
    id: string,
    status: SyncQueueStatus,
    errorMessage?: string
  ): Promise<void> {
    const updates: Partial<SyncQueueItem> = {
      status,
      lastAttemptAt: Date.now(),
    }

    if (status === 'failed') {
      const item = await db.syncQueue.get(id)
      if (item) {
        updates.retryCount = item.retryCount + 1
        updates.errorMessage = errorMessage
      }
    }

    await db.syncQueue.update(id, updates)
  }

  /**
   * 同期成功したアイテムをキューから削除
   */
  async markAsSynced(id: string): Promise<void> {
    await db.syncQueue.delete(id)
  }

  /**
   * エンティティIDで同期キューから削除（同期成功時）
   */
  async removeByEntityId(type: SyncQueueItemType, entityId: string): Promise<void> {
    await db.syncQueue
      .where('entityId')
      .equals(entityId)
      .and((item) => item.type === type)
      .delete()
  }

  /**
   * 未同期アイテムの数を取得
   */
  async getPendingCount(): Promise<number> {
    return db.syncQueue
      .where('status')
      .anyOf(['pending', 'failed'])
      .and((item) => item.retryCount < MAX_RETRY_COUNT)
      .count()
  }

  /**
   * タイプ別の未同期アイテム数を取得
   */
  async getPendingCountByType(): Promise<Record<SyncQueueItemType, number>> {
    const items = await db.syncQueue
      .where('status')
      .anyOf(['pending', 'failed'])
      .and((item) => item.retryCount < MAX_RETRY_COUNT)
      .toArray()

    const counts: Record<SyncQueueItemType, number> = {
      inspection: 0,
      inspectionItem: 0,
      result: 0,
      comment: 0,
      evidence: 0,
    }

    items.forEach((item) => {
      counts[item.type]++
    })

    return counts
  }

  /**
   * 失敗したアイテムをリセット（再試行用）
   */
  async resetFailedItems(): Promise<void> {
    await db.syncQueue
      .where('status')
      .equals('failed')
      .modify({ status: 'pending', retryCount: 0 })
  }

  /**
   * すべてのキューアイテムを取得（デバッグ用）
   */
  async getAllItems(): Promise<SyncQueueItem[]> {
    return db.syncQueue.toArray()
  }

  /**
   * キューをクリア
   */
  async clearQueue(): Promise<void> {
    await db.syncQueue.clear()
  }
}

export const syncQueueService = new SyncQueueService()
