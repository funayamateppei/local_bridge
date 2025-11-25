import Dexie, { type Table } from 'dexie'
import type {
  Area,
  Equipment,
  InspectionTask,
  InspectionResult,
  InspectionComment,
} from '@/domain/types/inspection'

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

  // Inspection App Tables
  areas!: Table<Area>
  equipments!: Table<Equipment>
  inspectionTasks!: Table<InspectionTask>
  inspectionResults!: Table<InspectionResult>
  inspectionComments!: Table<InspectionComment>

  constructor() {
    super('LocalBridgeDB')

    this.version(1).stores({
      logs: 'id, created_at, sync_status',
      settings: 'key',
    })

    this.version(2).stores({
      areas: 'id',
      equipments: 'id, areaId',
      inspectionTasks: 'id, areaId, equipmentId, status, updatedAt',
      inspectionResults: 'id, taskId',
      inspectionComments: 'id, taskId',
    })
  }
}

export const db = new LocalBridgeDatabase()
