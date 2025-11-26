import * as login from './login'
import * as register from './register'
import * as desktopTaskCreate from './desktop/task/create'
import * as desktopTaskList from './desktop/task/list'
import * as desktopTaskDetail from './desktop/task/detail'
import * as desktopInspectionList from './desktop/inspection/list'
import * as desktopInspectionDetail from './desktop/inspection/detail'
import * as mobileHome from './mobile/home'
import * as mobileTaskDetail from './mobile/task/detail'

export const pages = {
  login,
  register,
  desktop: {
    task: {
      create: desktopTaskCreate,
      list: desktopTaskList,
      detail: desktopTaskDetail,
    },
    inspection: {
      list: desktopInspectionList,
      detail: desktopInspectionDetail,
    },
  },
  mobile: {
    home: mobileHome,
    task: {
      detail: mobileTaskDetail,
    },
  },
}
