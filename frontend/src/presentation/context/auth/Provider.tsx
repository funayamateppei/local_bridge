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
            console.log('Token expired, clearing auth state')
            await db.settings.delete('auth_token')
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

  const login = async (token: string) => {
    await db.settings.put({ key: 'auth_token', value: token })
    setIsAuthenticated(true)
    const user = getUsernameFromToken(token)
    setUsername(user)
  }

  const logout = async () => {
    await db.settings.delete('auth_token')
    setIsAuthenticated(false)
    setUsername(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
