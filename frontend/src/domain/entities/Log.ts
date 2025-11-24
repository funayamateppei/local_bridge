export interface Log {
  id: string
  content: string
  mediaIds: string[]
  createdAt: number
  syncStatus: 'pending' | 'synced' | 'error'
}
