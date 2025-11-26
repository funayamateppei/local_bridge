export const Routing = {
  Root: (() => {
    const relative = ''
    const path = '/'
    return { relative, path }
  })(),

  Login: (() => {
    const relative = 'login'
    const path = `/${relative}`
    return { relative, path }
  })(),

  Register: (() => {
    const relative = 'register'
    const path = `/${relative}`
    return { relative, path }
  })(),

  Mobile: (() => {
    const relative = 'mobile'
    const path = `/${relative}`
    return {
      relative,
      path,

      Home: ((parentPath: string) => {
        const relative = ''
        const path = parentPath // Mobile index
        return { relative, path }
      })(path),

      Task: ((parentPath: string) => {
        const relative = 'tasks'
        const path = `${parentPath}/${relative}`
        return {
          relative,
          path,
          Detail: ((parentPath: string) => {
            const relative = ':taskId'
            const path = `${parentPath}/${relative}`
            return { relative, path }
          })(path),
        }
      })(path),
    }
  })(),

  Desktop: (() => {
    const relative = 'desktop'
    const path = `/${relative}`
    return {
      relative,
      path,
      Task: ((parentPath: string) => {
        const relative = 'tasks'
        const path = `${parentPath}/${relative}`
        return {
          relative,
          path,
          Create: ((parentPath: string) => {
            const relative = 'create'
            const path = `${parentPath}/${relative}`
            return { relative, path }
          })(path),
          Detail: ((parentPath: string) => {
            const relative = ':taskId'
            const path = `${parentPath}/${relative}`
            return { relative, path }
          })(path),
        }
      })(path),
    }
  })(),
} as const
