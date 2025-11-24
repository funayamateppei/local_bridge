import Dexie, { type Table } from 'dexie'

export interface Log {
  id: string
  content: string
  media_ids: string[]
  created_at: number
  sync_status: 'pending' | 'synced' | 'error'
}

export interface Setting {
  key: string
  value: unknown
}

export class LocalBridgeDatabase extends Dexie {
  logs!: Table<Log>
  settings!: Table<Setting>

  constructor() {
    super('LocalBridgeDB')
    this.version(1).stores({
      logs: 'id, created_at, sync_status',
      settings: 'key', // key-value store
    })
  }
}

export const db = new LocalBridgeDatabase()
