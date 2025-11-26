import { useParams, useNavigate } from 'react-router-dom'
import { useDesktopTaskDetail, useDesktopTaskActions } from '@/presentation/hooks/desktop'
import { TaskDetailView } from '@/presentation/features/desktop/TaskDetail/TaskDetailView'
import { useAuth } from '@/presentation/hooks/auth/useAuth'
import { Routing } from '@/presentation/routes/routing'

export const Page = () => {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const { username } = useAuth()

  const {
    task,
    area,
    equipment,
    results,
    comments,
    evidences,
    isLoading: isLoadingData,
    error,
    reload,
  } = useDesktopTaskDetail(taskId)

  const {
    isLoading: isLoadingAction,
    addComment,
    approve,
    requestCorrection,
  } = useDesktopTaskActions(taskId)

  const handleAddComment = async (content: string) => {
    if (!username) return
    try {
      await addComment(content, username)
      reload()
    } catch {
      alert('コメントの追加に失敗しました')
    }
  }

  const handleApprove = async () => {
    if (!username) return
    try {
      await approve(username)
      alert('タスクを承認しました')
      navigate(Routing.Desktop.Task.path)
    } catch {
      alert('承認に失敗しました')
    }
  }

  const handleRequestCorrection = async (comment: string) => {
    if (!username) return
    try {
      await requestCorrection(comment, username)
      alert('差し戻しました。再検査ステータスに変更されました。')
      navigate(Routing.Desktop.Task.path)
    } catch {
      alert('差し戻しに失敗しました')
    }
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>
  }

  if (isLoadingData || !task || !area || !equipment) {
    return <div className="p-8 text-center">読み込み中...</div>
  }

  return (
    <TaskDetailView
      task={task}
      area={area}
      equipment={equipment}
      results={results}
      comments={comments}
      evidences={evidences}
      onAddComment={handleAddComment}
      onApprove={handleApprove}
      onRequestCorrection={handleRequestCorrection}
      isLoading={isLoadingAction}
    />
  )
}
