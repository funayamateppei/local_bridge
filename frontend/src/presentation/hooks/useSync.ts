import { useState } from 'react'
import { syncService } from '@/infrastructure/services/SyncService'
import { useSyncStore } from '@/presentation/stores/useSyncStore'

export const useSync = () => {
  const { status, lastSyncedAt, error, startSync, syncSuccess, syncError, resetSync } =
    useSyncStore()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

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
      await syncService.fullSync()
      syncSuccess()
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
      syncSuccess()
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
      await syncService.pushLocalChanges()
      syncSuccess()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '変更の送信に失敗しました'
      syncError(errorMessage)
    }
  }

  return {
    // State
    status,
    lastSyncedAt,
    error,
    isOnline,
    isSyncing: status === 'syncing',

    // Actions
    sync: executeSync,
    syncMasterData: syncMasterDataOnly,
    pushChanges: pushChangesOnly,
    resetSync,
  }
}
