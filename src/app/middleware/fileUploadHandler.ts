import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import multer, { FileFilterCallback } from 'multer'
import sharp from 'sharp'
import ApiError from '../../errors/ApiError'

const fileUploadHandler = (maxSizeInMB: number = 100) => {
  const maxSize = maxSizeInMB * 1024 * 1024
  // Configure storage
  const storage = multer.memoryStorage()

  // File filter
  const filterFilter = async (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) => {
    console.log({ name: file })
    try {
      const allowedImageTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'image/webp',
      ]
      const allowedMediaTypes = [
        'video/mp4',
        'video/quicktime',
        'video/webm',
        'video/x-m4v',
        'audio/mpeg',
        'audio/wav',
        'audio/mp3',
        'audio/x-wav',
      ]
      const allowedDocTypes = ['application/pdf']

      if (
        ['image', 'license', 'signature', 'businessProfile'].includes(
          file.fieldname,
        )
      ) {
        if (allowedImageTypes.includes(file.mimetype)) {
          cb(null, true)
        } else {
          cb(
            new ApiError(
              StatusCodes.BAD_REQUEST,
              'Only .jpeg, .png, .jpg, .webp file supported',
            ),
          )
        }
      } else if (file.fieldname === 'media') {
        if (
          allowedMediaTypes.includes(file.mimetype) ||
          allowedImageTypes.includes(file.mimetype)
        ) {
          cb(null, true)
        } else {
          cb(
            new ApiError(
              StatusCodes.BAD_REQUEST,
              'Only .mp4, .mp3, .jpeg, .png, .jpg, .webp file supported',
            ),
          )
        }
      } else if (file.fieldname === 'clips') {
        if (
          allowedMediaTypes.includes(file.mimetype) ||
          allowedImageTypes.includes(file.mimetype)
        ) {
          cb(null, true)
        } else {
          cb(
            new ApiError(
              StatusCodes.BAD_REQUEST,
              'Only .mp4, .mp3, .jpeg, .png, .jpg, .webp file supported',
            ),
          )
        }
      } else if (file.fieldname === 'doc') {
        if (allowedDocTypes.includes(file.mimetype)) {
          cb(null, true)
        } else {
          cb(new ApiError(StatusCodes.BAD_REQUEST, 'Only pdf supported'))
        }
      } else {
        cb(new ApiError(StatusCodes.BAD_REQUEST, 'This file is not supported'))
      }
    } catch (error) {
      cb(
        new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'File validation failed',
        ),
      )
    }
  }

  const upload = multer({
    storage: storage,
    fileFilter: filterFilter,
    limits: {
      fileSize: maxSize,
      files: 10, // Maximum number of files allowed
    },
  }).fields([
    { name: 'image', maxCount: 5 },
    { name: 'media', maxCount: 5 },
    { name: 'doc', maxCount: 3 },
    { name: 'clips', maxCount: 20 },
  ])

  // Process uploaded images with Sharp
  const processImages = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.files) return next()

    try {
      const imageFields = [
        'image',
        'license',
        'signature',
        'businessProfile',
        'media',
        'clips',
      ]

      // Process each image field
      for (const field of imageFields) {
        const files = (req.files as any)[field]
        if (!files) continue

        // Process each file in the field
        for (const file of files) {
          if (!file.mimetype.startsWith('image')) continue

          // Resize and optimize the image
          let sharpInstance = sharp(file.buffer).resize({
            width: 1080,
            height: 1350,
          })

          if (file.mimetype === 'image/png') {
            sharpInstance = sharpInstance.png({ quality: 80 })
          } else if (file.mimetype === 'image/webp') {
            sharpInstance = sharpInstance.webp({ quality: 80 })
          } else {
            sharpInstance = sharpInstance.jpeg({ quality: 80 })
          }

          const optimizedBuffer = await sharpInstance.toBuffer()

          // Replace the original buffer with the optimized one
          file.buffer = optimizedBuffer
        }
      }
      next()
    } catch (error) {
      next(
        new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'Image processing failed',
        ),
      )
    }
  }

  // Return middleware chain
  return (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, err => {
      if (err) {
        if (
          err instanceof multer.MulterError &&
          err.code === 'LIMIT_FILE_SIZE'
        ) {
          return next(
            new ApiError(
              StatusCodes.BAD_REQUEST,
              `File too large. Maximum allowed size is ${maxSizeInMB} MB.`,
            ),
          )
        }
        return next(err)
      }
      processImages(req, res, next)
    })
  }
}

export default fileUploadHandler
