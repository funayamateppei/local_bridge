import { create } from 'zustand'

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

interface SyncState {
  status: SyncStatus
  lastSyncedAt: number | null
  error: string | null
  pendingCount: number
  syncedCount: number
  failedCount: number

  // Actions
  startSync: () => void
  syncSuccess: (syncedCount: number, failedCount: number) => void
  syncError: (error: string) => void
  resetSync: () => void
  setPendingCount: (count: number) => void
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'idle',
  lastSyncedAt: null,
  error: null,
  pendingCount: 0,
  syncedCount: 0,
  failedCount: 0,

  startSync: () => set({ status: 'syncing', error: null, syncedCount: 0, failedCount: 0 }),

  syncSuccess: (syncedCount: number, failedCount: number) =>
    set({
      status: failedCount > 0 ? 'error' : 'success',
      lastSyncedAt: Date.now(),
      error: failedCount > 0 ? `${failedCount}件の同期に失敗しました` : null,
      syncedCount,
      failedCount,
    }),

  syncError: (error: string) =>
    set({
      status: 'error',
      error,
    }),

  resetSync: () =>
    set({
      status: 'idle',
      error: null,
    }),

  setPendingCount: (count: number) => set({ pendingCount: count }),
}))
