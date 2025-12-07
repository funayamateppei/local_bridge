export type InspectionStatus = 'todo' | 'in_review' | 'done' | 'correction_needed'
export type InspectionVerdict = 'ok' | 'ng' | 'n_a'

export interface Area {
  id: string
  name: string
}

export interface Equipment {
  id: string
  name: string
  areaId: string
}

export interface Inspection {
  id: string
  title: string
  status: InspectionStatus
  createdAt: string // ISO 8601 UTC形式（ローカルで発行）
  updatedAt: string // ISO 8601 UTC形式（ローカルで発行）
  description?: string
}

export interface InspectionItem {
  id: string
  inspectionId: string
  title: string
  description?: string
  areaId: string
  equipmentId: string
  status: InspectionStatus
  createdAt: string // ISO 8601 UTC形式（ローカルで発行）
  updatedAt: string // ISO 8601 UTC形式（ローカルで発行）
}

export interface InspectionResult {
  id: string
  inspectionItemId: string
  verdict: InspectionVerdict
  note?: string
  evidenceIds: string[] // 写真などのID
  createdAt: string // ISO 8601 UTC形式（ローカルで発行）
  createdBy: string // ユーザーID
}

export interface InspectionComment {
  id: string
  inspectionItemId: string
  content: string
  createdAt: string // ISO 8601 UTC形式（ローカルで発行）
  createdBy: string // ユーザーID
  isSystemComment?: boolean // ステータス変更ログなど
}

export interface Evidence {
  id: string
  resultId: string // 紐づく検査結果のID
  type: 'image' | 'video'
  filePath: string // OPFSでのファイルパス
  mimeType: string // 'image/jpeg', 'video/mp4' など
  createdAt: string // ISO 8601 UTC形式（ローカルで発行）
  fileSize?: number // ファイルサイズ(bytes)
  thumbnailPath?: string // サムネイルのパス(オプション)
}
