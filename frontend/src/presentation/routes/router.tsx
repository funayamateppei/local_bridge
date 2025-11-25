import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { MainLayout } from '@/presentation/layouts/MainLayout'
import { pages } from '@/presentation/pages'
import { Routing } from '@/presentation/routes/routing'
import { ProtectedRoute } from './ProtectedRoute'

const router = createBrowserRouter(
  [
    {
      path: Routing.Login.path,
      element: <pages.login.Page />,
    },
    {
      path: Routing.Register.path,
      element: <pages.register.Page />,
    },
    {
      path: Routing.Root.path,
      element: (
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: <pages.home.Page />,
        },
        {
          path: Routing.Desktop.Task.Create.path,
          element: <pages.admin.task.create.Page />,
        },
        // Mobile Routes (Placeholder)
        {
          path: Routing.Mobile.Home.path,
          element: <div>Mobile Home (Coming Soon)</div>,
        },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  }
)

export function LocalBridgeRouter() {
  return <RouterProvider router={router} />
}
