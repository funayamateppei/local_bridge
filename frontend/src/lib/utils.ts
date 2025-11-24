import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Tailwind CSSのクラス名を動的に結合・解決するためのユーティリティ関数です。
 *
 * 1. `clsx`: 条件付きでクラス名を適用したり、配列やオブジェクト形式のクラス名を結合します。
 * 2. `tailwind-merge`: Tailwind CSSのクラス名の競合を解決します（例: `p-4` と `p-2` がある場合、後者を優先して `p-2` のみを残す）。
 *
 * これにより、コンポーネントのpropsで渡されたclassNameが、デフォルトのスタイルを適切に上書きできるようになります。
 *
 * 【使用基準】
 * - **共通UIコンポーネント**: `className` propsを受け取る場合は**必須**です。
 * - **通常のページ/機能**: 基本的に**不要**です。通常の文字列として記述してください。
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
