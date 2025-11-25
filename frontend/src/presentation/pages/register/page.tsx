import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/presentation/hooks/auth/useAuth'
import { Routing } from '@/presentation/routes/routing'
import { authRepository } from '@/infrastructure/repositories/AuthRepositoryImpl'
import { RegisterView } from '@/presentation/features/register/RegisterView'

export const Page = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleRegister = async (username: string) => {
    setIsLoading(true)
    setError('')
    try {
      const response = await authRepository.register({ username, password: 'password' }) // TODO: パスワード入力を追加するまで仮置き
      await login(response.token)
      navigate(Routing.Root.path)
    } catch (err) {
      console.error(err)
      setError('Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return <RegisterView onRegister={handleRegister} isLoading={isLoading} error={error} />
}
