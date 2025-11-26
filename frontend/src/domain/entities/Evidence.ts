export class Evidence {
  readonly id: string
  readonly resultId: string
  readonly type: 'image' | 'video'
  readonly filePath: string // OPFSでのファイルパス
  readonly mimeType: string
  readonly createdAt: number
  readonly fileSize?: number // ファイルサイズ(bytes)
  readonly thumbnailPath?: string // サムネイルのパス(オプション)

  constructor(
    id: string,
    resultId: string,
    type: 'image' | 'video',
    filePath: string,
    mimeType: string,
    createdAt: number,
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
