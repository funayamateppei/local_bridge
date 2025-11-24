import { AuthProvider } from './presentation/context/AuthContext'
import { LocalBridgeRouter } from './presentation/routes/router'

function App() {
  return (
    <AuthProvider>
      <LocalBridgeRouter />
    </AuthProvider>
  )
}

export default App
