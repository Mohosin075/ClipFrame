import express from 'express'
import { ContentController } from './content.controller'
import { ContentValidations } from './content.validation'
import validateRequest from '../../middleware/validateRequest'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import fileUploadHandler from '../../middleware/fileUploadHandler'
import { handleMediaUpload } from './mediaUpload'

const router = express.Router()

// /api/v1/content/
router
  .route('/')
  .get(
    auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.CREATOR),
    ContentController.getAllContents,
  )
  .post(
    auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.CREATOR),
    fileUploadHandler(),
    handleMediaUpload,
    validateRequest(ContentValidations.create),
    ContentController.createContent,
  )

// /api/v1/content/my-scheduled-history
router
  .route('/my-scheduled-history')
  .get(
    auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.CREATOR),
    ContentController.getAllScheduledAndHistory,
  )

// /api/v1/content/:id
router
  .route('/:id')
  .get(
    auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.CREATOR),
    ContentController.getSingleContent,
  )
  .patch(
    auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.CREATOR),
    validateRequest(ContentValidations.update),
    ContentController.updateContent,
  )
  .delete(
    auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.CREATOR),
    ContentController.deleteContent,
  )

// /api/v1/content/duplicate/:id
router
  .route('/duplicate/:id')
  .post(
    auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.CREATOR),
    ContentController.duplicateContent,
  )

export const ContentRoutes = router
