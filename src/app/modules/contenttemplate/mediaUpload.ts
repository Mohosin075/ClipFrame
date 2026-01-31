import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { S3Helper } from '../../../helpers/image/s3helper'
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
    const thumbnailFiles = (req.files as any)?.image as Express.Multer.File[]
    const previewFiles = (req.files as any)?.media as Express.Multer.File[]
    const stepsFiles = (req.files as any)?.clips as Express.Multer.File[]

    // Existing / Initial values
    let uploadedThumbnailUrl = payload.data.thumbnail
    let uploadedPreviewUrl = payload.data.previewUrl
    const steps = payload.data.steps || []

    // ===============================
    // 1. Upload thumbnail (image field)
    // ===============================
    if (thumbnailFiles?.length > 0) {
      const uploadedImages = await S3Helper.uploadMultipleFilesToS3(
        thumbnailFiles,
        'thumbnails',
      )
      if (uploadedImages.length > 0) {
        uploadedThumbnailUrl = uploadedImages[0]
      }
    }

    // ===============================
    // 2. Upload preview media (media field)
    // ===============================
    if (previewFiles?.length > 0) {
      const uploadedPreviews = await S3Helper.uploadMultipleVideosToS3(
        previewFiles,
        'previews',
      )
      if (uploadedPreviews.length > 0) {
        uploadedPreviewUrl = uploadedPreviews[0]
      }
    }

    // ===============================
    // 3. Upload steps media (clips field)
    // ===============================
    // For Content Templates, we want a tighter mapping.
    // Client should send 'clips' such that clips[i] belongs to steps[i] if media exists for that step.
    if (stepsFiles?.length > 0) {
      const uploadedClipsUrls = await S3Helper.uploadMultipleVideosToS3(
        stepsFiles,
        'steps',
      )

      if (uploadedClipsUrls.length > 0) {
        // Mapping logic:
        // We find steps that have 'mediaType' but no URL yet (or marked for upload).
        // For simplicity, we map sequentially to steps.
        let fileIndex = 0
        for (let i = 0; i < steps.length; i++) {
          // If this step is expected to have a video/image and we have a file for it
          if (fileIndex < uploadedClipsUrls.length) {
            const file = stepsFiles[fileIndex]
            const url = uploadedClipsUrls[fileIndex]
            
            // Only calculate duration if it's a video and the client didn't provide a string duration already
            // Actually, UI shows "Duration" as something like "4-6 seconds" (user input).
            // But we can also auto-calculate if needed. Let's stick to user input for the template's 'suggested' duration.
            
            steps[i].url = url
            fileIndex++
          }
        }
      }
    }

    // ===============================
    // Final body construction
    // ===============================
    req.body = { 
      ...payload.data, 
      thumbnail: uploadedThumbnailUrl, 
      previewUrl: uploadedPreviewUrl,
      steps 
    }

    next()
  } catch (error) {
    console.error('❌ Error in handleMediaUpload:', error)
    next(error)
  }
}
