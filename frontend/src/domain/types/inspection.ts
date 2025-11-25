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

export interface InspectionTask {
  id: string
  title: string
  description?: string
  areaId: string
  equipmentId: string
  status: InspectionStatus
  createdAt: number
  updatedAt: number
}

export interface InspectionResult {
  id: string
  taskId: string
  verdict: InspectionVerdict
  note?: string
  evidenceIds: string[] // 写真などのID
  createdAt: number
  createdBy: string // ユーザーID
}

export interface InspectionComment {
  id: string
  taskId: string
  content: string
  createdAt: number
  createdBy: string // ユーザーID
  isSystemComment?: boolean // ステータス変更ログなど
}
