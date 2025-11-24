import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { MainLayout } from '@/presentation/layouts/MainLayout'
import { pages } from '@/presentation/pages'
import { Routing } from '@/presentation/routes/routing'

const router = createBrowserRouter(
  [
    {
      path: Routing.Login.path,
      element: <pages.login.Page />,
    },
    {
      path: Routing.Root.path,
      element: <MainLayout />,
      children: [
        {
          index: true,
          element: <pages.home.Page />,
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
