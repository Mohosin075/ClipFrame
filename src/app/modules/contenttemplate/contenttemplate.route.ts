import express from 'express'
import { ContenttemplateController } from './contenttemplate.controller'
import { ContenttemplateValidations } from './contenttemplate.validation'
import validateRequest from '../../middleware/validateRequest'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'

const router = express.Router()

router.get(
  '/',
  auth(USER_ROLES.ADMIN),
  ContenttemplateController.getAllContenttemplates,
)

router.get(
  '/:id',
  auth(USER_ROLES.ADMIN),
  ContenttemplateController.getSingleContenttemplate,
)

router.post(
  '/',
  auth(USER_ROLES.ADMIN, USER_ROLES.ADMIN),

  validateRequest(ContenttemplateValidations.create),
  ContenttemplateController.createContenttemplate,
)

router.patch(
  '/:id',
  auth(USER_ROLES.ADMIN),

  validateRequest(ContenttemplateValidations.update),
  ContenttemplateController.updateContenttemplate,
)

router.delete(
  '/:id',
  auth(USER_ROLES.ADMIN),
  ContenttemplateController.deleteContenttemplate,
)

export const ContenttemplateRoutes = router
