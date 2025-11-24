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

  Mobile: (() => {
    const relative = ''
    const path = '/'
    return {
      relative,
      path,

      Home: ((parentPath: string) => {
        const relative = ''
        const path = parentPath // Home is index route
        return { relative, path }
      })(path),
    }
  })(),
} as const
