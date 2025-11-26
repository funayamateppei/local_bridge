import { db } from '@/infrastructure/db'
import { Inspection, InspectionItem } from '@/domain/entities'
import { v4 as uuidv4 } from 'uuid'

export class ReInspectionService {
  /**
   * NG項目から再検査を作成
   * @param inspectionId 元の検査ID
   * @returns 新しい検査のID
   */
  async createReInspection(inspectionId: string): Promise<string> {
    // 元の検査を取得
    const originalInspection = await db.inspections.get(inspectionId)
    if (!originalInspection) {
      throw new Error('Inspection not found')
    }

    // 検査項目を取得
    const items = await db.inspectionItems.where('inspectionId').equals(inspectionId).toArray()

    // NG項目のみをフィルタリング
    const ngItems = await this.filterNGItems(items)

    if (ngItems.length === 0) {
      throw new Error('No NG items found')
    }

    // 新しい検査を作成
    const now = Date.now()
    const newInspectionId = uuidv4()
    const newInspection = new Inspection(
      newInspectionId,
      `Re-inspection: ${originalInspection.title}`,
      'todo',
      now,
      now,
      `Re-inspection for NG items from ${originalInspection.title}`
    )

    await db.inspections.add({ ...newInspection })

    // NG項目を新しい検査にコピー
    for (const item of ngItems) {
      const newItem = new InspectionItem(
        uuidv4(),
        newInspectionId,
        item.title,
        item.areaId,
        item.equipmentId,
        'todo', // ステータスをリセット
        now,
        now,
        item.description
      )
      await db.inspectionItems.add({ ...newItem })
    }

    return newInspectionId
  }

  /**
   * NG項目をフィルタリング
   */
  private async filterNGItems(items: InspectionItem[]): Promise<InspectionItem[]> {
    const ngItems: InspectionItem[] = []

    for (const item of items) {
      // 検査結果を取得
      const results = await db.inspectionResults.where('inspectionItemId').equals(item.id).toArray()

      // 最新の結果がNGかチェック
      if (results.length > 0) {
        const latestResult = results[results.length - 1]
        if (latestResult.verdict === 'ng') {
          ngItems.push(item)
        }
      }
    }

    return ngItems
  }

  /**
   * 再検査が必要な項目数を取得
   */
  async countNGItems(inspectionId: string): Promise<number> {
    const items = await db.inspectionItems.where('inspectionId').equals(inspectionId).toArray()
    const ngItems = await this.filterNGItems(items)
    return ngItems.length
  }

  /**
   * 検査が完了しているかチェック
   */
  async isInspectionCompleted(inspectionId: string): Promise<boolean> {
    const inspection = await db.inspections.get(inspectionId)
    return inspection?.status === 'done'
  }
}

export const reInspectionService = new ReInspectionService()
