import { useRegisterForm } from '@/presentation/hooks/auth'
import { RegisterView } from '@/presentation/features/register/RegisterView'

export const Page = () => {
  const { handleRegister, isLoading, error } = useRegisterForm()

  return <RegisterView onRegister={handleRegister} isLoading={isLoading} error={error} />
}
