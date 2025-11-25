import { Link } from 'react-router-dom'
import { PlusCircle, ClipboardList } from 'lucide-react'
import { Routing } from '@/presentation/routes/routing'

export const HomeView = () => {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Select an action to proceed</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Admin Actions */}
        <div className="rounded-xl border border-surface bg-surface/30 p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <PlusCircle className="h-6 w-6" />
            <h3 className="font-semibold">Admin</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Create new inspection tasks and manage master data.
          </p>
          <Link
            to={Routing.Desktop.Task.Create.path}
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
          >
            Create Task
          </Link>
        </div>

        {/* Inspector Actions */}
        <div className="rounded-xl border border-surface bg-surface/30 p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2 text-secondary">
            <ClipboardList className="h-6 w-6" />
            <h3 className="font-semibold">Inspector</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            View assigned tasks and submit inspection results.
          </p>
          <Link
            to={Routing.Mobile.Home.path}
            className="inline-flex w-full items-center justify-center rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white hover:bg-secondary/90 transition-colors"
          >
            My Tasks
          </Link>
        </div>
      </div>
    </div>
  )
}
