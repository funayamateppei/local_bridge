import { Outlet } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '@/presentation/hooks/auth/useAuth'
import { Button, DropdownMenu, DropdownMenuItem } from '@/presentation/components/ui'

export const MainLayout = () => {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-background text-text font-sans selection:bg-primary selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-surface/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary" />
            <h1 className="text-xl font-bold tracking-tight">Local Bridge</h1>
          </div>
          <nav className="flex items-center gap-4">
            {/* Navigation items will go here */}
            <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />

            <DropdownMenu
              trigger={
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              }
            >
              <DropdownMenuItem icon={<User className="h-4 w-4" />}>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={logout} icon={<LogOut className="h-4 w-4" />}>
                Logout
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
