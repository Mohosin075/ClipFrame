import express from 'express'
import { SocialintegrationController } from './socialintegration.controller'
import { SocialintegrationValidations } from './socialintegration.validation'
import validateRequest from '../../middleware/validateRequest'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'

const router = express.Router()

router.get(
  '/',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER),
  SocialintegrationController.getAllSocialintegrations,
)

router.get(
  '/:id',
  auth(USER_ROLES.ADMIN),
  SocialintegrationController.getSingleSocialintegration,
)

router.post(
  '/',
  auth(USER_ROLES.ADMIN),

  validateRequest(SocialintegrationValidations.create),
  SocialintegrationController.createSocialintegration,
)

router.patch(
  '/:id',
  auth(USER_ROLES.ADMIN),

  validateRequest(SocialintegrationValidations.update),
  SocialintegrationController.updateSocialintegration,
)

router.delete(
  '/:id',
  auth(USER_ROLES.ADMIN),
  SocialintegrationController.deleteSocialintegration,
)

export const SocialintegrationRoutes = router
