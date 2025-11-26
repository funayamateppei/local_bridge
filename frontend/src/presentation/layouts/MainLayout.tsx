import { Link, useLocation, Outlet } from 'react-router-dom'
import { LogOut, User, ClipboardList, ListTodo } from 'lucide-react'
import { useAuth } from '@/presentation/hooks/auth/useAuth'
import { Button, DropdownMenu, DropdownMenuItem } from '@/presentation/components/ui'
import { SyncButton } from '@/presentation/components/SyncButton'
import { Routing } from '@/presentation/routes/routing'

export const MainLayout = () => {
  const { logout } = useAuth()
  const location = useLocation()

  const isActive = (path: string) => location.pathname.startsWith(path)

  return (
    <div className="min-h-screen bg-background text-text font-sans selection:bg-primary selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-surface/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary" />
              <h1 className="text-xl font-bold tracking-tight">Local Bridge</h1>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link to={Routing.Desktop.Inspection.List.path}>
                <Button
                  variant={isActive('/desktop/inspections') ? 'default' : 'ghost'}
                  className="gap-2"
                >
                  <ClipboardList className="h-4 w-4" />
                  検査一覧
                </Button>
              </Link>
              <Link to={Routing.Desktop.Task.path}>
                <Button
                  variant={isActive('/desktop/tasks') ? 'default' : 'ghost'}
                  className="gap-2"
                >
                  <ListTodo className="h-4 w-4" />
                  タスク管理
                </Button>
              </Link>
            </nav>
          </div>

          <nav className="flex items-center gap-4">
            <SyncButton />

            <div className="h-6 w-px bg-surface" />

            <DropdownMenu
              trigger={
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              }
            >
              <DropdownMenuItem icon={<User className="h-4 w-4" />}>プロフィール</DropdownMenuItem>
              <DropdownMenuItem onClick={logout} icon={<LogOut className="h-4 w-4" />}>
                ログアウト
              </DropdownMenuItem>
            </DropdownMenu>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
