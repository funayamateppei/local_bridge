import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/presentation/hooks/auth'
import { Routing } from '@/presentation/routes/routing'
import { RegisterView } from '@/presentation/features/register/RegisterView'

export const Page = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleRegister = async (username: string, password: string) => {
    setIsLoading(true)
    try {
      // Demo: Call backend to register and get token
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        throw new Error('Registration failed')
      }

      const data = await response.json()
      await login(data.token)
      navigate(Routing.Mobile.Home.path)
    } catch (error) {
      console.error('Registration error:', error)
      alert('Registration failed. Please check backend connection.')
    } finally {
      setIsLoading(false)
    }
  }

  return <RegisterView isLoading={isLoading} onSubmit={handleRegister} />
}
