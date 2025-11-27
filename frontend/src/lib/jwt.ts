/**
 * JWT トークンをデコードしてペイロードを取得する
 * 注意: 署名の検証は行わないため、信頼できるソースからのトークンのみ使用すること
 */
export const decodeJwt = (token: string): Record<string, unknown> | null => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

/**
 * JWT トークンからユーザー名を取得する
 */
export const getUsernameFromToken = (token: string): string | null => {
  const payload = decodeJwt(token)
  if (!payload) return null

  // JWT の標準クレーム 'sub' またはカスタムクレーム 'username' を確認
  const username = payload.sub || payload.username
  return typeof username === 'string' ? username : null
}

/**
 * JWT トークンが有効期限切れかチェックする
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwt(token)
  if (!payload || typeof payload.exp !== 'number') return true

  // exp は秒単位のタイムスタンプ
  const now = Math.floor(Date.now() / 1000)
  return payload.exp < now
}
