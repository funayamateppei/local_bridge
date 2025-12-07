import type { InspectionStatus } from '@/domain/types/inspection'

export class Inspection {
  readonly id: string
  readonly title: string
  status: InspectionStatus
  readonly createdAt: string // ISO 8601 UTC形式（ローカルで発行）
  updatedAt: string // ISO 8601 UTC形式（ローカルで発行）
  readonly description?: string

  constructor(
    id: string,
    title: string,
    status: InspectionStatus,
    createdAt: string,
    updatedAt: string,
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
