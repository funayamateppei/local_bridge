export class InspectionComment {
  readonly id: string
  readonly inspectionItemId: string
  readonly content: string
  readonly createdAt: number
  readonly createdBy: string
  readonly isSystemComment?: boolean

  constructor(
    id: string,
    inspectionItemId: string,
    content: string,
    createdAt: number,
    createdBy: string,
    isSystemComment?: boolean
  ) {
    this.id = id
    this.inspectionItemId = inspectionItemId
    this.content = content
    this.createdAt = createdAt
    this.createdBy = createdBy
    this.isSystemComment = isSystemComment
  }
}
