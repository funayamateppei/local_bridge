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

// Command Types - 操作の種類を明示的に定義
export type CommandType =
  // Inspection Commands
  | 'CREATE_INSPECTION'
  | 'UPDATE_INSPECTION_STATUS'
  // InspectionItem Commands
  | 'CREATE_INSPECTION_ITEM'
  | 'UPDATE_INSPECTION_ITEM_STATUS'
  // Result Commands
  | 'CREATE_RESULT'
  // Comment Commands
  | 'CREATE_COMMENT'
  // Evidence Commands
  | 'CREATE_EVIDENCE'

export type CommandStatus = 'pending' | 'executing' | 'failed'

// Command - 操作ログ形式のデータ構造
export interface Command {
  id: string
  type: CommandType
  payload: unknown
  timestamp: string // ISO 8601 UTC形式 (ローカルで発行)
  status: CommandStatus
  retryCount: number
  lastAttemptAt?: number
  errorMessage?: string
}

// 後方互換性のための型エイリアス（段階的に削除予定）
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

  // Command Queue (操作ログ)
  commandQueue!: Table<Command>

  // Sync Queue (後方互換性のため残す - 段階的に削除予定)
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

    // v6: Command Queue の追加（操作ログ形式）
    this.version(6).stores({
      commandQueue: 'id, type, status, timestamp',
    })
  }
}

export const db = new LocalBridgeDatabase()
