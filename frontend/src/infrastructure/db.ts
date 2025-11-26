import Dexie, { type Table } from 'dexie'
import type {
  Area,
  Equipment,
  Inspection,
  InspectionItem,
  InspectionResult,
  InspectionComment,
  Evidence,
} from '@/domain/types/inspection'

export interface Setting {
  key: string
  value: unknown
}

export type SyncQueueItemType =
  | 'inspection'
  | 'inspectionItem'
  | 'result'
  | 'comment'
  | 'evidence'

export type SyncQueueStatus = 'pending' | 'syncing' | 'failed'

export interface SyncQueueItem {
  id: string
  type: SyncQueueItemType
  entityId: string
  payload: unknown
  status: SyncQueueStatus
  retryCount: number
  createdAt: number
  lastAttemptAt?: number
  errorMessage?: string
}

export class LocalBridgeDatabase extends Dexie {
  settings!: Table<Setting>

  // Inspection App Tables
  areas!: Table<Area>
  equipments!: Table<Equipment>
  inspections!: Table<Inspection>
  inspectionItems!: Table<InspectionItem>
  inspectionResults!: Table<InspectionResult>
  inspectionComments!: Table<InspectionComment>
  evidences!: Table<Evidence>

  // Sync Queue
  syncQueue!: Table<SyncQueueItem>

  constructor() {
    super('LocalBridgeDB')

    this.version(1).stores({
      settings: 'key',
    })

    this.version(2).stores({
      areas: 'id',
      equipments: 'id, areaId',
      inspectionTasks: 'id, areaId, equipmentId, status, updatedAt',
      inspectionResults: 'id, taskId',
      inspectionComments: 'id, taskId',
    })

    this.version(3).stores({
      evidences: 'id, resultId',
    })

    this.version(4).stores({
      inspections: 'id, status, updatedAt',
      inspectionItems: 'id, inspectionId, areaId, equipmentId, status, updatedAt',
      inspectionResults: 'id, inspectionItemId',
      inspectionComments: 'id, inspectionItemId',
    })

    // v5: 同期キューの追加
    this.version(5).stores({
      syncQueue: 'id, type, entityId, status, createdAt',
    })
  }
}

export const db = new LocalBridgeDatabase()
