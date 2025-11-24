import { createContext, useEffect, useState, type ReactNode } from 'react'
import { db } from '../../infrastructure/db'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await db.settings.get('auth_token')
        if (token && token.value) {
          setIsAuthenticated(true)
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
  }

  const logout = async () => {
    await db.settings.delete('auth_token')
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
