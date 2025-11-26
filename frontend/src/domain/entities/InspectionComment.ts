export class InspectionComment {
  readonly id: string
  readonly taskId: string
  readonly content: string
  readonly createdAt: number
  readonly createdBy: string
  readonly isSystemComment?: boolean

  constructor(
    id: string,
    taskId: string,
    content: string,
    createdAt: number,
    createdBy: string,
    isSystemComment?: boolean
  ) {
    this.id = id
    this.taskId = taskId
    this.content = content
    this.createdAt = createdAt
    this.createdBy = createdBy
    this.isSystemComment = isSystemComment
  }
}
