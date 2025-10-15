import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { S3Helper } from '../../../helpers/image/s3helper'
import { IClips } from './content.interface'
import { Readable } from 'stream'
import getVideoDurationInSeconds from 'get-video-duration'

export const handleMediaUpload = async (req: any, res: any, next: any) => {
  try {
    const payload = req.body

    if (!payload.data) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Data is required')
    }

    // Parse JSON payload
    payload.data = JSON.parse(payload.data)

    // Files
    const imageFiles = (req.files as any)?.image as Express.Multer.File[]
    const videoFiles = (req.files as any)?.media as Express.Multer.File[]
    const clipsFiles = (req.files as any)?.clips as Express.Multer.File[]

    // Uploaded URLs
    let uploadedImageUrls: string[] = []
    let uploadedVideoUrls: string[] = []
    let uploadedClipsUrls: string[] = []

    // ===============================
    // Upload videos
    // ===============================
    if (videoFiles?.length > 0) {
      if (payload.data.contentType === 'carousel') {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Carousel posts support images only. Videos are not allowed. Please upload images instead.',
        )
      }

      uploadedVideoUrls = await S3Helper.uploadMultipleVideosToS3(
        videoFiles,
        'videos',
      )

      if (uploadedVideoUrls.length === 0) {
        throw new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'Failed to upload video files. Please try again.',
        )
      }
    }

    // ===============================
    // Upload clips
    // ===============================
    const clips: IClips[] = []
    if (clipsFiles?.length > 0) {
      uploadedClipsUrls = await S3Helper.uploadMultipleVideosToS3(
        clipsFiles,
        'clips',
      )

      if (uploadedClipsUrls.length === 0) {
        throw new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'Failed to upload clips. Please try again.',
        )
      }

      // Build clip metadata
      for (let i = 0; i < clipsFiles.length; i++) {
        const file = clipsFiles[i]
        const url = uploadedClipsUrls[i]

        let duration = 0
        try {
          const fileStream = Readable.from(file.buffer)
          duration = await getVideoDurationInSeconds(fileStream)
        } catch (err) {
          console.error('Failed to get video duration:', err)
        }

        clips.push({
          step: i + 1,
          url,
          duration,
          type: 'video',
          size: file.size, // in bytes
        })
      }
    }

    // ===============================
    // Upload images
    // ===============================
    if (imageFiles?.length > 0) {
      uploadedImageUrls = await S3Helper.uploadMultipleFilesToS3(
        imageFiles,
        'image',
      )

      if (uploadedImageUrls.length === 0) {
        throw new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'Failed to upload image files. Please try again.',
        )
      }
    }

    // ===============================
    // Collect all media URLs
    // ===============================
    const mediaUrls: string[] = []
    if (uploadedVideoUrls.length > 0) mediaUrls.push(...uploadedVideoUrls)
    if (uploadedImageUrls.length > 0) mediaUrls.push(...uploadedImageUrls)

    // ===============================
    // Final body
    // ===============================
    req.body = { ...payload.data, mediaUrls, clips }

    next()
  } catch (error) {
    console.error('❌ Error in handleMediaUpload:', error)
    next(error) // Pass error to your globalErrorHandler
  }
}
