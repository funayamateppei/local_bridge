import { useEffect, useState, type ReactNode } from 'react'
import { db } from '@/infrastructure/db'
import { getUsernameFromToken, isTokenExpired } from '@/lib/jwt'
import { AuthContext } from './context'

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await db.settings.get('auth_token')
        if (token && token.value) {
          const tokenValue = token.value as string
          if (isTokenExpired(tokenValue)) {
            console.log('Token expired, trying to refresh...')
            const refreshToken = await db.settings.get('refresh_token')

            if (refreshToken && refreshToken.value) {
              try {
                const response = await fetch('/api/auth/refresh', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ refreshToken: refreshToken.value }),
                })

                if (response.ok) {
                  const data = await response.json()
                  await db.settings.put({ key: 'auth_token', value: data.token })
                  await db.settings.put({ key: 'refresh_token', value: data.refreshToken })
                  setIsAuthenticated(true)
                  setUsername(getUsernameFromToken(data.token))
                  return
                }
              } catch (e) {
                console.error('Refresh failed:', e)
                // ネットワークエラーなどでリフレッシュできない場合は、
                // オフライン利用を継続させるためにログアウトせずに終了する
                // (サーバーから明示的に拒否されたわけではないため)
                return
              }
            }

            // リフレッシュ失敗（サーバー拒否）またはトークンなし
            console.log('Refresh failed or no token, logging out')
            await db.settings.delete('auth_token')
            await db.settings.delete('refresh_token')
            setIsAuthenticated(false)
            setUsername(null)
          } else {
            setIsAuthenticated(true)
            const user = getUsernameFromToken(tokenValue)
            setUsername(user)
          }
        }
      } catch (error) {
        console.error('Failed to restore auth state:', error)
      } finally {
        setIsLoading(false)
      }
    }
    initAuth()
  }, [])

  const login = async (token: string, refreshToken: string) => {
    await db.settings.put({ key: 'auth_token', value: token })
    await db.settings.put({ key: 'refresh_token', value: refreshToken })
    setIsAuthenticated(true)
    const user = getUsernameFromToken(token)
    setUsername(user)
  }

  const logout = async () => {
    await db.settings.delete('auth_token')
    await db.settings.delete('refresh_token')
    setIsAuthenticated(false)
    setUsername(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
