import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen'

export function createRouter() {
  const queryClient = new QueryClient()
  return createTanStackRouter({
    routeTree,
    basepath: '/perfect-print-creator',
    context: { queryClient },
  })
}

export const getRouter = createRouter

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
