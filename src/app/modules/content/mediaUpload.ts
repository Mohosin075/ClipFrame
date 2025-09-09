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
      return next(new ApiError(StatusCodes.BAD_REQUEST, 'Data is required'))
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
      uploadedVideoUrls = await S3Helper.uploadMultipleVideosToS3(
        videoFiles,
        'videos',
      )
      if (uploadedVideoUrls.length === 0) {
        return next(
          new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Failed to upload media',
          ),
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
        return next(
          new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Failed to upload clips',
          ),
        )
      }

      // build clip metadata
      for (let i = 0; i < clipsFiles.length; i++) {
        const file = clipsFiles[i]
        const url = uploadedClipsUrls[i]

        // Duration (in seconds)
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
        return next(
          new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Failed to upload media',
          ),
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

    console.log('✅ req.body after media upload:', req.body)

    next()
  } catch (error) {
    console.error('❌ Error in handleMediaUpload:', error)
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: 'Failed to upload media' })
  }
}
