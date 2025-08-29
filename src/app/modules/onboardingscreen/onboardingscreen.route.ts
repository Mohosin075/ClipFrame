import express from 'express'
import { OnboardingscreenController } from './onboardingscreen.controller'
import validateRequest from '../../middleware/validateRequest'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import {
  createOnboardingSchema
} from './onboardingscreen.validation'
import fileUploadHandler from '../../middleware/fileUploadHandler'
import { S3Helper } from '../../../helpers/image/s3helper'
import ApiError from '../../../errors/ApiError'
import { StatusCodes } from 'http-status-codes'

const router = express.Router()

router.get('/', OnboardingscreenController.getAllOnboardingscreens)

router.get('/:id', OnboardingscreenController.getSingleOnboardingscreen)

router.post(
  '/',
  auth(USER_ROLES.ADMIN),

  fileUploadHandler(),

  async (req, res, next) => {
    const payload = req.body
    try {
      const imageFiles = (req.files as any)?.image as Express.Multer.File[]

      if (imageFiles) {
        // Take the first image only
        const imageFile = imageFiles[0]

        // Upload single image to S3
        const uploadedImageUrl = await S3Helper.uploadToS3(imageFile, 'image')

        if (!uploadedImageUrl) {
          throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Failed to upload image',
          )
        }

        // Merge into req.body for Zod validation
        req.body = {
          imageURL: uploadedImageUrl,
          ...payload,
        }
      }
      next()
    } catch (error) {
      console.error({ error })
      res.status(400).json({ message: 'Failed to upload image' })
    }
  },

  validateRequest(createOnboardingSchema),
  OnboardingscreenController.createOnboardingscreen,
)

router.delete(
  '/:id',
  auth(USER_ROLES.ADMIN),
  OnboardingscreenController.deleteOnboardingscreen,
)

export const OnboardingscreenRoutes = router
