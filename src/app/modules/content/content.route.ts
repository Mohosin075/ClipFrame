import express from 'express'
import { ContentController } from './content.controller'
import { ContentValidations } from './content.validation'
import validateRequest from '../../middleware/validateRequest'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'

const router = express.Router()

router.get('/', auth(USER_ROLES.ADMIN), ContentController.getAllContents)

router.get('/:id', auth(USER_ROLES.ADMIN), ContentController.getSingleContent)

router.post(
  '/',
  auth(USER_ROLES.ADMIN),

  validateRequest(ContentValidations.create),
  ContentController.createContent,
)

router.patch(
  '/:id',
  auth(USER_ROLES.ADMIN),

  validateRequest(ContentValidations.update),
  ContentController.updateContent,
)

router.delete('/:id', auth(USER_ROLES.ADMIN), ContentController.deleteContent)

export const ContentRoutes = router
