import express from 'express'
import { StatsController } from './stats.controller'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'

const router = express.Router()

router.get(
  '/',
  auth(USER_ROLES.ADMIN, USER_ROLES.CREATOR, USER_ROLES.USER),
  StatsController.getUserStats,
)

export const StatsRoutes = router
