import Dexie, { type Table } from 'dexie'
import type {
  Area,
  Equipment,
  InspectionTask,
  InspectionResult,
  InspectionComment,
  Evidence,
} from '@/domain/types/inspection'

export interface Setting {
  key: string
  value: unknown
}

export class LocalBridgeDatabase extends Dexie {
  settings!: Table<Setting>

  // Inspection App Tables
  areas!: Table<Area>
  equipments!: Table<Equipment>
  inspectionTasks!: Table<InspectionTask>
  inspectionResults!: Table<InspectionResult>
  inspectionComments!: Table<InspectionComment>
  evidences!: Table<Evidence>

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
  }
}

export const db = new LocalBridgeDatabase()
