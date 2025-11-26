import { create } from 'zustand'

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

interface SyncState {
  status: SyncStatus
  lastSyncedAt: number | null
  error: string | null

  // Actions
  startSync: () => void
  syncSuccess: () => void
  syncError: (error: string) => void
  resetSync: () => void
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'idle',
  lastSyncedAt: null,
  error: null,

  startSync: () => set({ status: 'syncing', error: null }),

  syncSuccess: () =>
    set({
      status: 'success',
      lastSyncedAt: Date.now(),
      error: null,
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
}))
