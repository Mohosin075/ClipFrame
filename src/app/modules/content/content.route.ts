import express from 'express'
import { ContentController } from './content.controller'
import { ContentValidations } from './content.validation'
import validateRequest from '../../middleware/validateRequest'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import fileUploadHandler from '../../middleware/fileUploadHandler'
import ApiError from '../../../errors/ApiError'
import { StatusCodes } from 'http-status-codes'
import { S3Helper } from '../../../helpers/image/s3helper'

const handleMediaUpload = async (req: any, res: any, next: any) => {
  try {
    const payload = req.body

    if (!payload.data) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, 'Data is required'))
    }

    payload.data = JSON.parse(payload.data)

    const videoFiles = (req.files as any)?.media as Express.Multer.File[]
    const imageFiles = (req.files as any)?.image as Express.Multer.File[]

    let uploadedImageUrls: string[] = []
    let uploadedVideoUrls: string[] = []

    // Upload videos (use new video helper)
    if (videoFiles?.length > 0) {
      uploadedVideoUrls = await S3Helper.uploadMultipleVideosToS3(
        videoFiles,
        'videos',
      )
      // req.body = { ...payload.data, mediaUrls: uploadedVideoUrls }
    }

    if (videoFiles?.length > 0 && uploadedVideoUrls.length === 0) {
      return next(
        new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'Failed to upload media',
        ),
      )
    }

    if (imageFiles?.length > 0) {
      uploadedImageUrls = await S3Helper.uploadMultipleFilesToS3(
        imageFiles,
        'image',
      )
    }

    if (imageFiles?.length > 0 && uploadedImageUrls.length === 0) {
      return next(
        new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'Failed to upload media',
        ),
      )
    }

    const mediaUrls = [] as string[]
    if (uploadedVideoUrls.length > 0) {
      mediaUrls.push(...uploadedVideoUrls)
    }
    if (uploadedImageUrls.length > 0) {
      mediaUrls.push(...uploadedImageUrls)
    }

    req.body = { ...payload.data, mediaUrls }

    next()
  } catch (error) {
    console.error('Error in handleMediaUpload:', error)
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: 'Failed to upload media' })
  }
}

const router = express.Router()

router.get(
  '/',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.CREATOR),
  ContentController.getAllContents,
)

router.get(
  '/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.CREATOR),
  ContentController.getSingleContent,
)

router.post(
  '/',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.CREATOR),

  fileUploadHandler(),

  handleMediaUpload,

  validateRequest(ContentValidations.create),
  ContentController.createContent,
)

router.patch(
  '/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.CREATOR),

  validateRequest(ContentValidations.update),
  ContentController.updateContent,
)

router.delete(
  '/:id',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.CREATOR),
  ContentController.deleteContent,
)

export const ContentRoutes = router
