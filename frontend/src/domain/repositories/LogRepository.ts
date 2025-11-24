import { Log } from '../entities/Log'

export interface LogRepository {
  save(log: Log): Promise<void>
  getAll(): Promise<Log[]>
  getById(id: string): Promise<Log | undefined>
  delete(id: string): Promise<void>
  getPendingLogs(): Promise<Log[]>
  markAsSynced(id: string): Promise<void>
}
