import { UserRoutes } from '../app/modules/user/user.route'
import { AuthRoutes } from '../app/modules/auth/auth.route'
import express, { Router } from 'express'
import { NotificationRoutes } from '../app/modules/notifications/notifications.route'
import { PublicRoutes } from '../app/modules/public/public.route'
import { SupportRoutes } from '../app/modules/support/support.route'
import { UseronboardingRoutes } from '../app/modules/useronboarding/useronboarding.route'
import { ContentRoutes } from '../app/modules/content/content.route'
import { SocialintegrationRoutes } from '../app/modules/socialintegration/socialintegration.route'
import { PlanRoutes } from '../app/modules/plan/plan.routes'
import { SubscriptionRoutes } from '../app/modules/subscription/subscription.routes'
import { StatsRoutes } from '../app/modules/stats/stats.route'
import { ContenttemplateRoutes } from '../app/modules/contenttemplate/contenttemplate.route'

const router = express.Router()

const apiRoutes: { path: string; route: Router }[] = [
  { path: '/user', route: UserRoutes },
  { path: '/auth', route: AuthRoutes },
  { path: '/notifications', route: NotificationRoutes },
  { path: '/public', route: PublicRoutes },
  { path: '/support', route: SupportRoutes },
  { path: '/useronboarding', route: UseronboardingRoutes },
  { path: '/content', route: ContentRoutes },
  { path: '/socialintegration', route: SocialintegrationRoutes },
  { path: '/plan', route: PlanRoutes },
  { path: '/subscription', route: SubscriptionRoutes },
  { path: '/stats', route: StatsRoutes },
  { path: '/contentTemplate', route: ContenttemplateRoutes }]

apiRoutes.forEach(route => {
  router.use(route.path, route.route)
})

export default router
