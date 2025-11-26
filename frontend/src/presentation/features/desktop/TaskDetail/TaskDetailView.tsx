import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle, HelpCircle, MessageSquare, FileImage } from 'lucide-react'
import { Button, Textarea } from '@/presentation/components/ui'
import { Routing } from '@/presentation/routes/routing'
import type {
  InspectionItem,
  Area,
  Equipment,
  InspectionResult,
  InspectionComment,
  Evidence,
} from '@/domain/types/inspection'

interface TaskDetailViewProps {
  task: InspectionItem
  area: Area
  equipment: Equipment
  results: InspectionResult[]
  comments: InspectionComment[]
  evidences: Record<string, Evidence[]> // resultId -> Evidence[]
  onAddComment: (content: string) => void
  onApprove: () => void
  onRequestCorrection: (comment: string) => void
  isLoading: boolean
}

export const TaskDetailView = ({
  task,
  area,
  equipment,
  results,
  comments,
  evidences,
  onAddComment,
  onApprove,
  onRequestCorrection,
  isLoading,
}: TaskDetailViewProps) => {
  const navigate = useNavigate()
  const [commentText, setCommentText] = useState('')
  const [correctionText, setCorrectionText] = useState('')

  const latestResult = results[results.length - 1]

  const verdictConfig = {
    ok: { label: 'OK', icon: CheckCircle2, color: 'text-green-500' },
    ng: { label: 'NG', icon: XCircle, color: 'text-red-500' },
    n_a: { label: 'N/A', icon: HelpCircle, color: 'text-gray-500' },
  }

  const handleAddComment = () => {
    if (!commentText.trim()) return
    onAddComment(commentText)
    setCommentText('')
  }

  const handleRequestCorrection = () => {
    if (!correctionText.trim()) return
    onRequestCorrection(correctionText)
    setCorrectionText('')
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <button
          onClick={() => navigate(Routing.Desktop.Task.path)}
          className="mb-4 text-sm text-primary hover:underline"
        >
          ← Back to Task List
        </button>

        {/* Task Info */}
        <div className="mb-6 rounded-xl border border-surface bg-surface/30 p-6 backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
              {area.name}
            </span>
            <span className="text-sm text-muted-foreground">→</span>
            <span className="rounded-full bg-secondary/10 px-2 py-1 text-xs font-semibold text-secondary">
              {equipment.name}
            </span>
          </div>
          <h2 className="mb-2 text-2xl font-bold">{task.title}</h2>
          {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
        </div>

        {/* Inspection Result */}
        {latestResult ? (
          <div className="mb-6 rounded-xl border border-surface bg-surface/30 p-6">
            <h3 className="mb-4 text-lg font-bold">Latest Inspection Result</h3>

            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-muted-foreground">Verdict</p>
              <div className="flex items-center gap-2">
                {(() => {
                  const config = verdictConfig[latestResult.verdict]
                  const Icon = config.icon
                  return (
                    <>
                      <Icon className={`h-6 w-6 ${config.color}`} />
                      <span className="text-lg font-semibold">{config.label}</span>
                    </>
                  )
                })()}
              </div>
            </div>

            {latestResult.note && (
              <div className="mb-4">
                <p className="mb-2 text-sm font-medium text-muted-foreground">Notes</p>
                <p className="rounded-lg bg-background/50 p-3 text-sm">{latestResult.note}</p>
              </div>
            )}

            {/* Evidence (Photos/Videos) */}
            {/* TODO: OPFS実装後に有効化 */}
            {evidences[latestResult.id] && evidences[latestResult.id].length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">Evidence</p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {evidences[latestResult.id].map((evidence) => (
                    <div
                      key={evidence.id}
                      className="relative rounded-lg border border-surface overflow-hidden bg-surface/50 p-4 text-center"
                    >
                      <FileImage className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">{evidence.type}</p>
                      <p className="text-xs text-muted-foreground truncate">{evidence.filePath}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-6 text-center">
            <p className="text-yellow-700">No inspection results submitted yet.</p>
          </div>
        )}

        {/* Comments */}
        <div className="mb-6 rounded-xl border border-surface bg-surface/30 p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
            <MessageSquare className="h-5 w-5" />
            Comments
          </h3>

          {comments.length > 0 ? (
            <div className="mb-4 space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-lg bg-background/50 p-3">
                  <p className="text-sm">{comment.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    By {comment.createdBy} • {new Date(comment.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mb-4 text-sm text-muted-foreground">No comments yet.</p>
          )}

          <div className="flex gap-2">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              className="flex-1"
            />
            <Button onClick={handleAddComment} disabled={!commentText.trim() || isLoading}>
              Add
            </Button>
          </div>
        </div>

        {/* Actions */}
        {task.status === 'in_review' && latestResult && (
          <div className="rounded-xl border border-surface bg-surface/30 p-6">
            <h3 className="mb-4 text-lg font-bold">Review Actions</h3>

            <div className="space-y-4">
              {/* Approve */}
              <div>
                <Button
                  onClick={onApprove}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Approve & Mark as Done
                </Button>
              </div>

              {/* Request Correction */}
              <div>
                <Textarea
                  value={correctionText}
                  onChange={(e) => setCorrectionText(e.target.value)}
                  placeholder="Explain what needs to be corrected..."
                  rows={3}
                  className="mb-2"
                />
                <Button
                  onClick={handleRequestCorrection}
                  disabled={!correctionText.trim() || isLoading}
                  variant="outline"
                  className="w-full border-red-500 text-red-500 hover:bg-red-500/10"
                >
                  Request Correction (Re-check)
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
