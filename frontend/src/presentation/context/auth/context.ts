import { createContext } from 'react'

export interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  username: string | null
  login: (token: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
