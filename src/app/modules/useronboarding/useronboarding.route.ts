import express from 'express'
import { UseronboardingController } from './useronboarding.controller'
import validateRequest from '../../middleware/validateRequest'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import { UserOnboardingSchema } from './useronboarding.validation'
import fileUploadHandler from '../../middleware/fileUploadHandler'
import { S3Helper } from '../../../helpers/image/s3helper'
import ApiError from '../../../errors/ApiError'
import { StatusCodes } from 'http-status-codes'

const router = express.Router()

const handleBrandingImageUpload = async (req: any, res: any, next: any) => {
  try {
    const payload = req.body
    if (payload.brandColors) {
      payload.brandColors = JSON.parse(payload.brandColors || '[]')
      req.body.brandColors = payload.brandColors
    }

    const imageFiles = (req.files as any)?.image as Express.Multer.File[]
    if (imageFiles) {
      const uploadedImageUrls = await S3Helper.uploadMultipleFilesToS3(
        imageFiles,
        'image',
      )
      if (uploadedImageUrls.length > 0) {
        req.body.logo = uploadedImageUrls[0]
      }
    }
  } catch (error) {
    console.error({ error })
    return res.status(400).json({ message: 'Failed to upload image' })
  }

  next()
}

router.get(
  '/',
  auth(USER_ROLES.ADMIN),
  UseronboardingController.getAllUseronboardings,
)

router.get(
  '/:id',
  auth(USER_ROLES.ADMIN),
  UseronboardingController.getSingleUseronboarding,
)

router.post(
  '/',
  auth(USER_ROLES.ADMIN, USER_ROLES.STUDENT),

  validateRequest(UserOnboardingSchema),
  UseronboardingController.createUseronboarding,
)

router.post(
  '/branding',
  auth(USER_ROLES.ADMIN, USER_ROLES.STUDENT),

  fileUploadHandler(),

  handleBrandingImageUpload,
  // validateRequest(UserOnboardingSchema),
  UseronboardingController.createUseronboarding,
)

router.delete(
  '/:id',
  auth(USER_ROLES.ADMIN),
  UseronboardingController.deleteUseronboarding,
)

export const UseronboardingRoutes = router
