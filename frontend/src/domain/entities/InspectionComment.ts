export class InspectionComment {
  readonly id: string
  readonly inspectionItemId: string
  readonly content: string
  readonly createdAt: string // ISO 8601 UTC形式（ローカルで発行）
  readonly createdBy: string
  readonly isSystemComment?: boolean

  constructor(
    id: string,
    inspectionItemId: string,
    content: string,
    createdAt: string,
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
