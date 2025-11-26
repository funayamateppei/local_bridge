/**
 * OPFS (Origin Private File System) Storage
 *
 * 画像・動画などのバイナリファイルを効率的に保存・取得するためのストレージクラス
 */
export class OPFSStorage {
  private rootPromise: Promise<FileSystemDirectoryHandle>

  constructor() {
    this.rootPromise = this.initializeRoot()
  }

  /**
   * ルートディレクトリハンドルを初期化
   */
  private async initializeRoot(): Promise<FileSystemDirectoryHandle> {
    if (!('storage' in navigator) || !('getDirectory' in navigator.storage)) {
      throw new Error('OPFS is not supported in this browser')
    }
    return await navigator.storage.getDirectory()
  }

  /**
   * ファイルを保存
   * @param path ファイルパス (例: "/evidence/abc-123.jpg")
   * @param blob 保存するBlobデータ
   */
  async saveFile(path: string, blob: Blob): Promise<void> {
    const root = await this.rootPromise
    const { dirHandle, fileName } = await this.ensureDirectory(root, path)

    // ファイルハンドルを取得（存在しない場合は作成）
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true })

    // 書き込み可能なストリームを作成
    const writable = await fileHandle.createWritable()
    await writable.write(blob)
    await writable.close()
  }

  /**
   * ファイルを取得
   * @param path ファイルパス
   * @returns File オブジェクト
   */
  async getFile(path: string): Promise<File> {
    const root = await this.rootPromise
    const { dirHandle, fileName } = await this.getDirectoryAndFileName(root, path)

    const fileHandle = await dirHandle.getFileHandle(fileName)
    return await fileHandle.getFile()
  }

  /**
   * ファイルをBlobとして取得
   * @param path ファイルパス
   * @returns Blob オブジェクト
   */
  async getBlob(path: string): Promise<Blob> {
    const file = await this.getFile(path)
    return new Blob([file], { type: file.type })
  }

  /**
   * ファイルをData URLとして取得（画像・動画の表示用）
   * @param path ファイルパス
   * @returns Data URL文字列
   */
  async getDataURL(path: string): Promise<string> {
    const blob = await this.getBlob(path)
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  /**
   * ファイルを削除
   * @param path ファイルパス
   */
  async deleteFile(path: string): Promise<void> {
    const root = await this.rootPromise
    const { dirHandle, fileName } = await this.getDirectoryAndFileName(root, path)

    await dirHandle.removeEntry(fileName)
  }

  /**
   * ファイルが存在するかチェック
   * @param path ファイルパス
   * @returns 存在する場合true
   */
  async exists(path: string): Promise<boolean> {
    try {
      await this.getFile(path)
      return true
    } catch {
      return false
    }
  }

  /**
   * ディレクトリとファイル名を取得（ディレクトリが存在しない場合は作成）
   */
  private async ensureDirectory(
    root: FileSystemDirectoryHandle,
    path: string
  ): Promise<{ dirHandle: FileSystemDirectoryHandle; fileName: string }> {
    const parts = path.split('/').filter((p) => p.length > 0)
    const fileName = parts.pop()

    if (!fileName) {
      throw new Error('Invalid file path')
    }

    let currentDir = root
    for (const part of parts) {
      currentDir = await currentDir.getDirectoryHandle(part, { create: true })
    }

    return { dirHandle: currentDir, fileName }
  }

  /**
   * ディレクトリとファイル名を取得（ディレクトリが存在しない場合はエラー）
   */
  private async getDirectoryAndFileName(
    root: FileSystemDirectoryHandle,
    path: string
  ): Promise<{ dirHandle: FileSystemDirectoryHandle; fileName: string }> {
    const parts = path.split('/').filter((p) => p.length > 0)
    const fileName = parts.pop()

    if (!fileName) {
      throw new Error('Invalid file path')
    }

    let currentDir = root
    for (const part of parts) {
      currentDir = await currentDir.getDirectoryHandle(part)
    }

    return { dirHandle: currentDir, fileName }
  }

  /**
   * ディレクトリ内の全ファイルを削除（クリーンアップ用）
   * @param dirPath ディレクトリパス (例: "/evidence")
   */
  async clearDirectory(dirPath: string): Promise<void> {
    const root = await this.rootPromise
    const parts = dirPath.split('/').filter((p) => p.length > 0)

    let currentDir = root
    for (const part of parts) {
      try {
        currentDir = await currentDir.getDirectoryHandle(part)
      } catch {
        // ディレクトリが存在しない場合は何もしない
        return
      }
    }

    // ディレクトリ内の全エントリを削除
    // @ts-expect-error - OPFS API may not be fully typed
    for await (const [name] of currentDir.entries()) {
      await currentDir.removeEntry(name, { recursive: true })
    }
  }
}

// シングルトンインスタンス
export const opfsStorage = new OPFSStorage()
