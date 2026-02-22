import express from 'express'
import { StatsController } from './stats.controller'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'

const router = express.Router()

router.get(
  '/',
  auth(USER_ROLES.ADMIN, USER_ROLES.CREATOR, USER_ROLES.USER),
  StatsController.getAllPlatformStats,
)

router.get(
  '/user-content-stats',
  auth(USER_ROLES.ADMIN, USER_ROLES.CREATOR, USER_ROLES.USER),
  StatsController.getUserStats,
)

router.get(
  '/dashboard',
  auth(USER_ROLES.ADMIN),
  StatsController.getAdminDashboardStats,
)

router.get(
  '/user-stats',
  auth(USER_ROLES.ADMIN),
  StatsController.getAdminUserStats,
)

export const StatsRoutes = router
