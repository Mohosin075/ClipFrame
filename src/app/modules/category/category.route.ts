import express from 'express'
import { CategoryController } from './category.controller'
import { CategoryValidations } from './category.validation'
import validateRequest from '../../middleware/validateRequest'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'
import fileUploadHandler from '../../middleware/fileUploadHandler'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { S3Helper } from '../../../helpers/image/s3helper'

const router = express.Router()

router.get('/', CategoryController.getAllCategorys)

router.get('/:id', CategoryController.getSingleCategory)

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
          image: uploadedImageUrl,
          ...payload,
        }
      }
      next()
    } catch (error) {
      console.error({ error })
      res.status(400).json({ message: 'Failed to upload image' })
    }
  },

  validateRequest(CategoryValidations.create),
  CategoryController.createCategory,
)

router.patch(
  '/:id',
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
          image: uploadedImageUrl,
          ...payload,
        }
      }
      next()
    } catch (error) {
      console.error({ error })
      res.status(400).json({ message: 'Failed to upload image' })
    }
  },

  validateRequest(CategoryValidations.update),
  CategoryController.updateCategory,
)

router.delete('/:id', auth(USER_ROLES.ADMIN), CategoryController.deleteCategory)

export const CategoryRoutes = router
