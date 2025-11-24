import { AuthProvider } from '@/presentation/context/auth'
import { LocalBridgeRouter } from '@/presentation/routes/router'

function App() {
  return (
    <AuthProvider>
      <LocalBridgeRouter />
    </AuthProvider>
  )
}

export default App
