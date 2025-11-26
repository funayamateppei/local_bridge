import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { authRepository } from '@/infrastructure/repositories/AuthRepositoryImpl'
import { useAuth } from '@/presentation/hooks/auth/useAuth'
import { Routing } from '@/presentation/routes/routing'

export const useRegisterForm = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleRegister = useCallback(
    async (username: string) => {
      setIsLoading(true)
      setError('')
      try {
        const response = await authRepository.register({ username, password: 'password' }) // TODO: パスワード入力を追加するまで仮置き
        await login(response.token)
        navigate(Routing.Root.path)
      } catch (err) {
        console.error(err)
        setError('登録に失敗しました。もう一度お試しください。')
      } finally {
        setIsLoading(false)
      }
    },
    [login, navigate]
  )

  return {
    handleRegister,
    isLoading,
    error,
  }
}
