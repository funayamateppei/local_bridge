import { useState, useEffect } from 'react'
import { opfsStorage } from '@/infrastructure/storage/opfs'

/**
 * OPFSからファイルを読み込んでData URLとして取得するフック
 * @param filePath OPFSのファイルパス
 * @returns Data URL文字列（ローディング中はnull）
 */
export const useOPFSFile = (filePath: string | null): string | null => {
  const [dataURL, setDataURL] = useState<string | null>(filePath ? null : null)

  useEffect(() => {
    if (!filePath) {
      return
    }

    let isMounted = true

    const loadFile = async () => {
      try {
        const url = await opfsStorage.getDataURL(filePath)
        if (isMounted) {
          setDataURL(url)
        }
      } catch (error) {
        console.error('Failed to load file from OPFS:', error)
        if (isMounted) {
          setDataURL(null)
        }
      }
    }

    loadFile()

    return () => {
      isMounted = false
      // Data URLのメモリ解放は不要（FileReader内部で管理）
    }
  }, [filePath])

  return dataURL
}
