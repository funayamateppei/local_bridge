import { db } from '@/infrastructure/db'
import type { IInspectionRepository } from '@/domain/repositories/InspectionRepository'
import type { Area, Equipment, InspectionTask } from '@/domain/types/inspection'
import { v4 as uuidv4 } from 'uuid'

export class InspectionRepositoryImpl implements IInspectionRepository {
  async getAreas(): Promise<Area[]> {
    return db.areas.toArray()
  }

  async getEquipments(areaId: string): Promise<Equipment[]> {
    return db.equipments.where('areaId').equals(areaId).toArray()
  }

  async createTask(task: Omit<InspectionTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const now = Date.now()
    const newTask: InspectionTask = {
      ...task,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    }
    await db.inspectionTasks.add(newTask)
  }

  async getTasksByArea(areaId: string): Promise<InspectionTask[]> {
    return db.inspectionTasks.where('areaId').equals(areaId).toArray()
  }
}

export const inspectionRepository = new InspectionRepositoryImpl()
