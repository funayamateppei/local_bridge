export class Evidence {
  readonly id: string
  readonly resultId: string
  readonly type: 'image' | 'video'
  readonly filePath: string // OPFSでのファイルパス
  readonly mimeType: string
  readonly createdAt: string // ISO 8601 UTC形式（ローカルで発行）
  readonly fileSize?: number // ファイルサイズ(bytes)
  readonly thumbnailPath?: string // サムネイルのパス(オプション)

  constructor(
    id: string,
    resultId: string,
    type: 'image' | 'video',
    filePath: string,
    mimeType: string,
    createdAt: string,
    fileSize?: number,
    thumbnailPath?: string
  ) {
    this.id = id
    this.resultId = resultId
    this.type = type
    this.filePath = filePath
    this.mimeType = mimeType
    this.createdAt = createdAt
    this.fileSize = fileSize
    this.thumbnailPath = thumbnailPath
  }
}
