import * as home from './home'
import * as login from './login'
import * as register from './register'
import * as adminTaskCreate from './admin/task/create'

export const pages = {
  login,
  register,
  home,
  admin: {
    task: {
      create: adminTaskCreate,
    },
  },
}
