import type { Area, Equipment, InspectionTask } from '@/domain/types/inspection'

export interface IInspectionRepository {
  getAreas(): Promise<Area[]>
  getEquipments(areaId: string): Promise<Equipment[]>
  createTask(task: Omit<InspectionTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<void>
  getTasksByArea(areaId: string): Promise<InspectionTask[]>
}
