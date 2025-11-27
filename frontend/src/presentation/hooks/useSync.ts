import { useState, useEffect, useCallback } from 'react'
import { syncService } from '@/infrastructure/services/SyncService'
import { useSyncStore } from '@/presentation/stores/useSyncStore'

export const useSync = () => {
  const {
    status,
    lastSyncedAt,
    error,
    pendingCount,
    syncedCount,
    failedCount,
    progress,
    startSync,
    syncSuccess,
    syncError,
    resetSync,
    setPendingCount,
    updateProgress,
  } = useSyncStore()
  const [isOnline] = useState(navigator.onLine)

  /**
   * 未同期アイテム数を更新
   */
  const refreshPendingCount = useCallback(async () => {
    const count = await syncService.getPendingCount()
    setPendingCount(count)
  }, [setPendingCount])

  // 初回マウント時と定期的に未同期数を更新
  useEffect(() => {
    refreshPendingCount()
    const interval = setInterval(refreshPendingCount, 10000) // 10秒ごと
    return () => clearInterval(interval)
  }, [refreshPendingCount])

  /**
   * 同期を実行
   */
  const executeSync = async () => {
    if (!navigator.onLine) {
      syncError('オフラインのため同期できません')
      return
    }

    startSync()

    try {
      const result = await syncService.fullSync((current, total, message) => {
        updateProgress(current, total, message)
      })
      syncSuccess(result.syncedCount, result.failedCount)
      await refreshPendingCount()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '同期に失敗しました'
      syncError(errorMessage)
    }
  }

  /**
   * マスターデータのみ同期
   */
  const syncMasterDataOnly = async () => {
    if (!navigator.onLine) {
      syncError('オフラインのため同期できません')
      return
    }

    startSync()

    try {
      await syncService.syncMasterData()
      syncSuccess(0, 0)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'マスターデータの同期に失敗しました'
      syncError(errorMessage)
    }
  }

  /**
   * ローカルの変更のみ送信
   */
  const pushChangesOnly = async () => {
    if (!navigator.onLine) {
      syncError('オフラインのため送信できません')
      return
    }

    startSync()

    try {
      const result = await syncService.pushLocalChanges((current, total, message) => {
        updateProgress(current, total, message)
      })
      syncSuccess(result.syncedCount, result.failedCount)
      await refreshPendingCount()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '変更の送信に失敗しました'
      syncError(errorMessage)
    }
  }

  /**
   * 失敗したアイテムをリセット
   */
  const retryFailed = async () => {
    await syncService.resetFailedItems()
    await refreshPendingCount()
  }

  return {
    // State
    status,
    lastSyncedAt,
    error,
    isOnline,
    isSyncing: status === 'syncing',
    pendingCount,
    syncedCount,
    failedCount,
    hasPendingChanges: pendingCount > 0,
    progress,

    // Actions
    sync: executeSync,
    syncMasterData: syncMasterDataOnly,
    pushChanges: pushChangesOnly,
    resetSync,
    retryFailed,
    refreshPendingCount,
  }
}
