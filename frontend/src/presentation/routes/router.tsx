import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
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
          element: <Navigate to={Routing.Mobile.path} replace />,
        },
        // Desktop Routes
        {
          path: Routing.Desktop.Task.path,
          element: <pages.desktop.task.list.Page />,
        },
        {
          path: Routing.Desktop.Task.Create.path,
          element: <pages.desktop.task.create.Page />,
        },
        {
          path: Routing.Desktop.Task.Detail.path,
          element: <pages.desktop.task.detail.Page />,
        },
        {
          path: Routing.Desktop.Inspection.List.path,
          element: <pages.desktop.inspection.list.Page />,
        },
        {
          path: Routing.Desktop.Inspection.Detail.path,
          element: <pages.desktop.inspection.detail.Page />,
        },
        // Mobile Routes
        {
          path: Routing.Mobile.Home.path,
          element: <pages.mobile.home.Page />,
        },
        {
          path: Routing.Mobile.Task.Detail.path,
          element: <pages.mobile.task.detail.Page />,
        },
        {
          path: '*',
          element: <div className="p-4 text-center">ページが見つかりません</div>,
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
