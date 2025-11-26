export class Evidence {
  readonly id: string
  readonly resultId: string
  readonly type: 'image' | 'video'
  readonly data: string
  readonly mimeType: string
  readonly createdAt: number

  constructor(
    id: string,
    resultId: string,
    type: 'image' | 'video',
    data: string,
    mimeType: string,
    createdAt: number
  ) {
    this.id = id
    this.resultId = resultId
    this.type = type
    this.data = data
    this.mimeType = mimeType
    this.createdAt = createdAt
  }
}
