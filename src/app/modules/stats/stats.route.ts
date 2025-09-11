import express from 'express'
import { StatsController } from './stats.controller'
import validateRequest from '../../middleware/validateRequest'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'

const router = express.Router()

router.get('/', auth(USER_ROLES.ADMIN), StatsController.getAllStatss)

router.get('/:id', auth(USER_ROLES.ADMIN), StatsController.getSingleStats)


export const StatsRoutes = router
