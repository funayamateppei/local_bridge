import { v4 as uuidv4 } from 'uuid'
import { db, type Command, type CommandType, type CommandStatus } from '@/infrastructure/db'

const MAX_RETRY_COUNT = 3

/**
 * Command Service - 操作ログ形式でローカル操作を記録し、オンライン時にサーバーへ反映
 *
 * - FEで順序管理不要（親エンティティを気にせず記録、種別順で実行）
 * - createdAt/updatedAtはローカルでUTC発行
 * - サーバーはCommandを順番に適用するだけ
 */
export class CommandService {
  /**
   * Commandを記録
   * ローカルで操作を行った時に呼び出す
   */
  async recordCommand(type: CommandType, payload: unknown): Promise<string> {
    const command: Command = {
      id: uuidv4(),
      type,
      payload,
      timestamp: new Date().toISOString(), // ローカルでUTC発行
      status: 'pending',
      retryCount: 0,
    }
    await db.commandQueue.add(command)
    return command.id
  }

  /**
   * 実行待ちのCommandを取得（timestamp順）
   */
  async getPendingCommands(): Promise<Command[]> {
    return db.commandQueue
      .where('status')
      .anyOf(['pending', 'failed'])
      .and((cmd) => cmd.retryCount < MAX_RETRY_COUNT)
      .sortBy('timestamp')
  }

  /**
   * 特定タイプのCommandを取得
   */
  async getPendingCommandsByType(type: CommandType): Promise<Command[]> {
    return db.commandQueue
      .where('type')
      .equals(type)
      .and((cmd) => cmd.status !== 'executing' && cmd.retryCount < MAX_RETRY_COUNT)
      .sortBy('timestamp')
  }

  /**
   * Commandのステータスを更新
   */
  async updateStatus(
    id: string,
    status: CommandStatus,
    errorMessage?: string
  ): Promise<void> {
    const updates: Partial<Command> = {
      status,
      lastAttemptAt: Date.now(),
    }

    if (status === 'failed') {
      const command = await db.commandQueue.get(id)
      if (command) {
        updates.retryCount = command.retryCount + 1
        updates.errorMessage = errorMessage
      }
    }

    await db.commandQueue.update(id, updates)
  }

  /**
   * 実行完了したCommandを削除
   */
  async markAsExecuted(id: string): Promise<void> {
    await db.commandQueue.delete(id)
  }

  /**
   * 未実行Command数を取得
   */
  async getPendingCount(): Promise<number> {
    return db.commandQueue
      .where('status')
      .anyOf(['pending', 'failed'])
      .and((cmd) => cmd.retryCount < MAX_RETRY_COUNT)
      .count()
  }

  /**
   * タイプ別の未実行Command数を取得
   */
  async getPendingCountByType(): Promise<Record<string, number>> {
    const commands = await db.commandQueue
      .where('status')
      .anyOf(['pending', 'failed'])
      .and((cmd) => cmd.retryCount < MAX_RETRY_COUNT)
      .toArray()

    const counts: Record<string, number> = {}
    commands.forEach((cmd) => {
      counts[cmd.type] = (counts[cmd.type] || 0) + 1
    })

    return counts
  }

  /**
   * 失敗したCommandをリセット（再試行用）
   */
  async resetFailedCommands(): Promise<void> {
    await db.commandQueue
      .where('status')
      .equals('failed')
      .modify({ status: 'pending', retryCount: 0 })
  }

  /**
   * 全Commandを取得（デバッグ用）
   */
  async getAllCommands(): Promise<Command[]> {
    return db.commandQueue.orderBy('timestamp').toArray()
  }

  /**
   * Commandキューをクリア
   */
  async clearQueue(): Promise<void> {
    await db.commandQueue.clear()
  }
}

export const commandService = new CommandService()
