import { create } from 'zustand'

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

interface SyncProgress {
  current: number
  total: number
  message: string
}

interface SyncState {
  status: SyncStatus
  lastSyncedAt: number | null
  error: string | null
  pendingCount: number
  syncedCount: number
  failedCount: number
  progress: SyncProgress | null

  // Actions
  startSync: () => void
  syncSuccess: (syncedCount: number, failedCount: number) => void
  syncError: (error: string) => void
  resetSync: () => void
  setPendingCount: (count: number) => void
  updateProgress: (current: number, total: number, message: string) => void
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'idle',
  lastSyncedAt: null,
  error: null,
  pendingCount: 0,
  syncedCount: 0,
  failedCount: 0,
  progress: null,

  startSync: () =>
    set({ status: 'syncing', error: null, syncedCount: 0, failedCount: 0, progress: null }),

  syncSuccess: (syncedCount: number, failedCount: number) =>
    set({
      status: failedCount > 0 ? 'error' : 'success',
      lastSyncedAt: Date.now(),
      error: failedCount > 0 ? `${failedCount}件の同期に失敗しました` : null,
      syncedCount,
      failedCount,
      progress: null,
    }),

  syncError: (error: string) =>
    set({
      status: 'error',
      error,
      progress: null,
    }),

  resetSync: () =>
    set({
      status: 'idle',
      error: null,
      progress: null,
    }),

  setPendingCount: (count: number) => set({ pendingCount: count }),

  updateProgress: (current: number, total: number, message: string) =>
    set({
      progress: { current, total, message },
    }),
}))
