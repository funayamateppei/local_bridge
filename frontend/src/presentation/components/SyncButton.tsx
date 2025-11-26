import { RefreshCw, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react'
import { useSync } from '@/presentation/hooks/useSync'
import { Button } from '@/presentation/components/ui'

export const SyncButton = () => {
  const { status, lastSyncedAt, error, isOnline, isSyncing, sync } = useSync()

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />
    if (isSyncing) return <RefreshCw className="h-4 w-4 animate-spin" />
    if (status === 'success') return <CheckCircle className="h-4 w-4" />
    if (status === 'error') return <AlertCircle className="h-4 w-4" />
    return <Wifi className="h-4 w-4" />
  }

  const getStatusText = () => {
    if (!isOnline) return 'オフライン'
    if (isSyncing) return '同期中...'
    if (status === 'success' && lastSyncedAt) {
      const date = new Date(lastSyncedAt)
      return `同期済 ${date.toLocaleTimeString()}`
    }
    if (status === 'error') return '同期失敗'
    return '同期'
  }

  const getButtonVariant = (): 'default' | 'outline' | 'ghost' | 'link' | undefined => {
    if (status === 'error') return 'default'
    if (status === 'success') return 'outline'
    return 'default'
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={sync}
        disabled={!isOnline || isSyncing}
        variant={getButtonVariant()}
        size="sm"
        className="flex items-center gap-2"
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </Button>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
