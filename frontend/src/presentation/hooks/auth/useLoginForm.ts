import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { authRepository } from '@/infrastructure/repositories/AuthRepositoryImpl'
import { useAuth } from '@/presentation/hooks/auth/useAuth'
import { Routing } from '@/presentation/routes/routing'

export const useLoginForm = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = useCallback(
    async (username: string) => {
      setIsLoading(true)
      setError('')
      try {
        const response = await authRepository.login({ username, password: 'password' }) // TODO: パスワード入力を追加するまで仮置き
        await login(response.token)
        navigate(Routing.Root.path)
      } catch (err) {
        console.error(err)
        setError('ログインに失敗しました。ユーザー名を確認してください。')
      } finally {
        setIsLoading(false)
      }
    },
    [login, navigate]
  )

  return {
    handleLogin,
    isLoading,
    error,
  }
}
