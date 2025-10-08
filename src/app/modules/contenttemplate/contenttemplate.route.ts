import express from 'express'
import { ContenttemplateController } from './contenttemplate.controller'
import { ContenttemplateValidations } from './contenttemplate.validation'
import validateRequest from '../../middleware/validateRequest'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'

const router = express.Router()

router
  .route('/recent')
  .get(auth(USER_ROLES.ADMIN), ContenttemplateController.getRecentTemplates)

// Base route: '/'
router
  .route('/')
  .get(auth(USER_ROLES.ADMIN), ContenttemplateController.getAllContenttemplates)
  .post(
    auth(USER_ROLES.ADMIN),
    validateRequest(ContenttemplateValidations.create),
    ContenttemplateController.createContenttemplate,
  )

// Route for single content template: '/:id'
router
  .route('/:id')
  .get(
    auth(USER_ROLES.ADMIN),
    ContenttemplateController.getSingleContenttemplate,
  )
  .patch(
    auth(USER_ROLES.ADMIN),
    validateRequest(ContenttemplateValidations.update),
    ContenttemplateController.updateContenttemplate,
  )
  .delete(
    auth(USER_ROLES.ADMIN),
    ContenttemplateController.deleteContenttemplate,
  )

// Route for toggle love: '/:id/love'
router.route('/:id/love').patch(
  auth(USER_ROLES.ADMIN, USER_ROLES.CREATOR, USER_ROLES.USER),
  ContenttemplateController.toggleTemplateLove, // separate controller for love
)

export const ContenttemplateRoutes = router
