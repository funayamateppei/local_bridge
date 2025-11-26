import * as home from './home'
import * as login from './login'
import * as register from './register'
import * as desktopTaskCreate from './desktop/task/create'
import * as desktopTaskList from './desktop/task/list'
import * as desktopTaskDetail from './desktop/task/detail'
import * as mobileHome from './mobile/home'
import * as mobileTaskDetail from './mobile/task/detail'

export const pages = {
  login,
  register,
  home,
  desktop: {
    task: {
      create: desktopTaskCreate,
      list: desktopTaskList,
      detail: desktopTaskDetail,
    },
  },
  mobile: {
    home: mobileHome,
    task: {
      detail: mobileTaskDetail,
    },
  },
}
