import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Routing } from '../../routes/routing'
import { LoginView } from '../../features/login/LoginView'

export const Page = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (username: string) => {
    setIsLoading(true)
    try {
      // Demo: Call backend to get token
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      if (!response.ok) {
        throw new Error('Login failed')
      }

      const data = await response.json()
      await login(data.token)
      navigate(Routing.Mobile.Home.path)
    } catch (error) {
      console.error('Login error:', error)
      alert('Login failed. Please check backend connection.')
    } finally {
      setIsLoading(false)
    }
  }

  return <LoginView isLoading={isLoading} onSubmit={handleLogin} />
}
