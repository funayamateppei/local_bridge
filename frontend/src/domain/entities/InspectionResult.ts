import type { InspectionVerdict } from '@/domain/types/inspection'

export class InspectionResult {
  readonly id: string
  readonly inspectionItemId: string
  readonly verdict: InspectionVerdict
  readonly evidenceIds: string[]
  readonly createdAt: number
  readonly createdBy: string
  readonly note?: string

  constructor(
    id: string,
    inspectionItemId: string,
    verdict: InspectionVerdict,
    evidenceIds: string[],
    createdAt: number,
    createdBy: string,
    note?: string
  ) {
    this.id = id
    this.inspectionItemId = inspectionItemId
    this.verdict = verdict
    this.evidenceIds = evidenceIds
    this.createdAt = createdAt
    this.createdBy = createdBy
    this.note = note
  }
}
