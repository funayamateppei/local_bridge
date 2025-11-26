import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/presentation/components/ui'

export const ReloadPrompt = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error: unknown) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-surface bg-background p-4 shadow-lg">
      <div className="mb-2 text-sm">
        {offlineReady ? (
          <span>App ready to work offline</span>
        ) : (
          <span>New content available, click on reload button to update.</span>
        )}
      </div>
      <div className="flex gap-2">
        {needRefresh && (
          <Button onClick={() => updateServiceWorker(true)} size="sm">
            Reload
          </Button>
        )}
        <Button onClick={close} variant="outline" size="sm">
          Close
        </Button>
      </div>
    </div>
  )
}
