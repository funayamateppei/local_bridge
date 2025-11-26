import { RefreshCw, CheckCircle, AlertCircle, Wifi, WifiOff, CloudOff } from 'lucide-react'
import { useSync } from '@/presentation/hooks/useSync'
import { Button } from '@/presentation/components/ui'

export const SyncButton = () => {
  const {
    status,
    lastSyncedAt,
    error,
    isOnline,
    isSyncing,
    pendingCount,
    hasPendingChanges,
    sync,
  } = useSync()

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />
    if (isSyncing) return <RefreshCw className="h-4 w-4 animate-spin" />
    if (status === 'success' && !hasPendingChanges) return <CheckCircle className="h-4 w-4" />
    if (status === 'error') return <AlertCircle className="h-4 w-4" />
    if (hasPendingChanges) return <CloudOff className="h-4 w-4" />
    return <Wifi className="h-4 w-4" />
  }

  const getStatusText = () => {
    if (!isOnline) return 'オフライン'
    if (isSyncing) return '同期中...'
    if (hasPendingChanges) return `未同期: ${pendingCount}件`
    if (status === 'success' && lastSyncedAt) {
      const date = new Date(lastSyncedAt)
      return `同期済 ${date.toLocaleTimeString()}`
    }
    if (status === 'error') return '同期失敗'
    return '同期'
  }

  const getButtonVariant = (): 'default' | 'outline' | 'ghost' | 'link' | undefined => {
    if (status === 'error') return 'default'
    if (hasPendingChanges) return 'default'
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
        {hasPendingChanges && (
          <span className="ml-1 rounded-full bg-orange-500 px-1.5 py-0.5 text-xs text-white">
            {pendingCount}
          </span>
        )}
      </Button>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
