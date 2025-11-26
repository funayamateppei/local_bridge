import { AuthProvider } from '@/presentation/context/auth'
import { LocalBridgeRouter } from '@/presentation/routes/router'

import { ReloadPrompt } from '@/presentation/components/ReloadPrompt'

function App() {
  return (
    <AuthProvider>
      <LocalBridgeRouter />
      <ReloadPrompt />
    </AuthProvider>
  )
}

export default App
