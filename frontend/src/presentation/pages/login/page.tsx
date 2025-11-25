import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/presentation/hooks/auth/useAuth'
import { Routing } from '@/presentation/routes/routing'
import { authRepository } from '@/infrastructure/repositories/AuthRepositoryImpl'
import { LoginView } from '@/presentation/features/login/LoginView'

export const Page = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (username: string) => {
    setIsLoading(true)
    setError('')
    try {
      const response = await authRepository.login({ username, password: 'password' }) // TODO: パスワード入力を追加するまで仮置き
      await login(response.token)
      navigate(Routing.Root.path)
    } catch (err) {
      console.error(err)
      setError('Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return <LoginView onLogin={handleLogin} isLoading={isLoading} error={error} />
}
