import { UserRoutes } from '../app/modules/user/user.route'
import { AuthRoutes } from '../app/modules/auth/auth.route'
import express, { Router } from 'express'
import { NotificationRoutes } from '../app/modules/notifications/notifications.route'
import { PublicRoutes } from '../app/modules/public/public.route'
import { SupportRoutes } from '../app/modules/support/support.route'
import { ReviewRoutes } from '../app/modules/review/review.route'
import { CategoryRoutes } from '../app/modules/category/category.route'
import { UseronboardingRoutes } from '../app/modules/useronboarding/useronboarding.route'
import { ContentRoutes } from '../app/modules/content/content.route'

const router = express.Router()

const apiRoutes: { path: string; route: Router }[] = [
  { path: '/user', route: UserRoutes },
  { path: '/auth', route: AuthRoutes },

  { path: '/notifications', route: NotificationRoutes },

  { path: '/public', route: PublicRoutes },

  { path: '/support', route: SupportRoutes },
  { path: '/review', route: ReviewRoutes },

  { path: '/category', route: CategoryRoutes },

  { path: '/useronboarding', route: UseronboardingRoutes },
,
  { path: '/content', route: ContentRoutes }]

apiRoutes.forEach(route => {
  router.use(route.path, route.route)
})

export default router
