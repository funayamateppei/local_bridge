import { useEffect } from 'react'
import { AuthProvider } from '@/presentation/context/auth'
import { LocalBridgeRouter } from '@/presentation/routes/router'
import { seedDatabase } from '@/infrastructure/db/seed'

function App() {
  useEffect(() => {
    seedDatabase()
  }, [])

  return (
    <AuthProvider>
      <LocalBridgeRouter />
    </AuthProvider>
  )
}

export default App
