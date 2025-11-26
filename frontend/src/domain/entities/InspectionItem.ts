import type { InspectionStatus } from '@/domain/types/inspection'

export class InspectionItem {
  readonly id: string
  readonly inspectionId: string
  readonly title: string
  readonly areaId: string
  readonly equipmentId: string
  status: InspectionStatus
  readonly createdAt: number
  updatedAt: number
  readonly description?: string

  constructor(
    id: string,
    inspectionId: string,
    title: string,
    areaId: string,
    equipmentId: string,
    status: InspectionStatus,
    createdAt: number,
    updatedAt: number,
    description?: string
  ) {
    this.id = id
    this.inspectionId = inspectionId
    this.title = title
    this.areaId = areaId
    this.equipmentId = equipmentId
    this.status = status
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.description = description
  }
}
