import type { InspectionStatus } from '@/domain/types/inspection'

export class Inspection {
  readonly id: string
  readonly title: string
  status: InspectionStatus
  readonly createdAt: number
  updatedAt: number
  readonly description?: string

  constructor(
    id: string,
    title: string,
    status: InspectionStatus,
    createdAt: number,
    updatedAt: number,
    description?: string
  ) {
    this.id = id
    this.title = title
    this.status = status
    this.createdAt = createdAt
    this.updatedAt = updatedAt
    this.description = description
  }
}
