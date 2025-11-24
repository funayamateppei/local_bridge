import { Navigate } from 'react-router-dom'
import { useAuth } from '@/presentation/hooks/auth'
import { Routing } from '@/presentation/routes/routing'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-text">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={Routing.Login.path} replace />
  }

  return <>{children}</>
}
