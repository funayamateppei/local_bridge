import { useLoginForm } from '@/presentation/hooks/auth'
import { LoginView } from '@/presentation/features/login/LoginView'

export const Page = () => {
  const { handleLogin, isLoading, error } = useLoginForm()

  return <LoginView onLogin={handleLogin} isLoading={isLoading} error={error} />
}
