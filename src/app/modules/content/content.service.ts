import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { Content } from './content.model'
import { JwtPayload } from 'jsonwebtoken'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { CONTENT_STATUS, contentSearchableFields } from './content.constants'
import mongoose, { Types } from 'mongoose'
import { ContentType, IContent, IContentFilterables } from './content.interface'
import { checkAndIncrementUsage } from '../subscription/checkSubscription'
import { Socialintegration } from '../socialintegration/socialintegration.model'
import { buildCaptionWithTags } from '../../../utils/caption'
import {
  createInstagramCarousel,
  getInstagramTokenAndIdFromDB,
  uploadAndQueueInstagramContent,
  uploadFacebookCarouselScheduled,
  uploadFacebookPhotoScheduled,
  uploadFacebookReelScheduled,
  uploadFacebookStory,
  uploadInstagramStory,
} from '../../../helpers/graphAPIHelper'
import { ContentTemplate } from '../contenttemplate/contenttemplate.model'
import { detectMediaType } from '../../../helpers/detectMedia'
import { Stats } from '../stats/stats.model'
import axios from 'axios'
import FormData from 'form-data'

// Old version
// export const createContent = async (
//   user: JwtPayload,
//   payload: IContent,
// ): Promise<IContent> => {
//   if (!payload.mediaUrls || payload.mediaUrls.length === 0) {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'Media URLs are required to create content.',
//     )
//   }

//   let facebook, instagram
//   if (payload.platform) {
//     facebook = payload.platform.includes('facebook')
//     instagram = payload.platform.includes('instagram')
//   }

//   if (!facebook && !instagram) {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       'Please select at least one platform (Facebook or Instagram) to publish the content.',
//     )
//   }

//   if (
//     (payload.contentType === 'post' ||
//       payload.contentType === 'reel' ||
//       payload.contentType === 'story') &&
//     Array.isArray(payload.mediaUrls)
//   ) {
//     payload.mediaUrls = payload.mediaUrls.slice(0, 1)
//   }

//   if (payload.contentType === 'carousel') {
//     if (payload.mediaUrls.length < 2) {
//       throw new ApiError(
//         StatusCodes.BAD_REQUEST,
//         'At least 2 media URLs are required for carousel content.',
//       )
//     }
//   }

//   try {
//     // Check and increment usage inside the session
//     await checkAndIncrementUsage(user, payload.contentType as ContentType)

//     // Create content inside the same session
//     // const result = await Content.create(payload) // note the array form
//     const result = await Content.create([payload]) // note the array form

//     if (!result || result.length === 0) {
//       throw new ApiError(
//         StatusCodes.BAD_REQUEST,
//         'Failed to create Content, please try again with valid data.',
//       )
//     }

//     const caption = buildCaptionWithTags(payload?.caption, payload?.tags)

//     // implement facebook content posting
//     if (facebook) {
//       console.log('hit facebook')
//       const facebookAccount = await Socialintegration.findOne({
//         user: user.authId,
//         platform: 'facebook',
//       })

//       if (
//         !facebookAccount ||
//         !facebookAccount.accounts ||
//         facebookAccount.accounts.length === 0
//       ) {
//         throw new ApiError(
//           StatusCodes.BAD_REQUEST,
//           'No Facebook social account found, please connect your Facebook account first.',
//         )
//       }

//       if (facebookAccount && facebookAccount?.accounts?.length > 0) {
//         const pageId = facebookAccount.accounts[0].pageId
//         const pageAccessToken = facebookAccount.accounts[0].pageAccessToken!

//         // For Post
//         if (payload.contentType === 'post') {
//           const published = await uploadFacebookPhotoScheduled(
//             pageId,
//             pageAccessToken,
//             payload.mediaUrls![0],
//             caption,
//             result[0]._id,
//             true,
//           )
//           console.log('Published to Facebook Page:', published)
//           if (!published) {
//             throw new ApiError(
//               StatusCodes.BAD_REQUEST,
//               'Failed to schedule Facebook post, please try again.',
//             )
//           }
//         } else if (payload.contentType === 'reel') {
//           const reelsPublished = await uploadFacebookReelScheduled(
//             pageId,
//             pageAccessToken,
//             payload.mediaUrls![0],
//             caption,
//             result[0]._id,
//             true,
//           )
//           console.log('Published to Facebook Page:', reelsPublished)
//           if (!reelsPublished) {
//             throw new ApiError(
//               StatusCodes.BAD_REQUEST,
//               'Failed to schedule Facebook reel, please try again.',
//             )
//           }
//         } else if (payload.contentType === 'carousel') {
//           const carouselPublished = await uploadFacebookCarouselScheduled(
//             pageId,
//             pageAccessToken,
//             payload.mediaUrls!,
//             caption,
//             result[0]._id,
//             true,
//           )
//           console.log('Published to Facebook Page:', carouselPublished)
//           if (!carouselPublished) {
//             throw new ApiError(
//               StatusCodes.BAD_REQUEST,
//               'Failed to schedule Facebook carousel, please try again.',
//             )
//           }
//         } else if (payload.contentType === 'story') {
//           const type = await detectMediaType(payload.mediaUrls![0])

//           if (type === 'video') {
//             throw new ApiError(
//               StatusCodes.BAD_REQUEST,
//               'Facebook Stories support images only. Videos are not allowed.',
//             )
//           }

//           const storyPostId = await uploadFacebookStory({
//             pageId,
//             pageAccessToken,
//             mediaUrl: payload.mediaUrls![0],
//             type: type,
//             caption: 'Check this video!',
//             contentId: result[0]._id,
//           })

//           console.log('Published to Facebook Page:', storyPostId)
//           if (!storyPostId) {
//             throw new ApiError(
//               StatusCodes.BAD_REQUEST,
//               'Failed to schedule Facebook story, please try again.',
//             )
//           }
//         }
//       }
//     }

//     // implementing instagram content posing
//     if (instagram) {
//       console.log('hit instagram')

//       // get Id and token from DB
//       const { instagramId, instagramAccessToken } =
//         await getInstagramTokenAndIdFromDB(user.authId)

//       if (payload.contentType === 'post' || payload.contentType === 'reel') {
//         console.log('hit post')
//         const containerId = await uploadAndQueueInstagramContent(
//           result[0]._id.toString(),
//           instagramId,
//           instagramAccessToken,
//         )
//         console.log(containerId)
//       } else if (payload.contentType === 'carousel') {
//         console.log('hit carousel')
//         const carouselContainerId = await createInstagramCarousel({
//           igUserId: instagramId,
//           accessToken: instagramAccessToken,
//           imageUrls: result[0].mediaUrls!,
//           caption: result[0].caption,
//           contentId: result[0]._id,
//         })

//         console.log('Carousel Container ID:', carouselContainerId)
//       } else if (payload.contentType === 'story') {
//         const type = await detectMediaType(payload.mediaUrls![0])
//         console.log('hit story')
//         const carouselContainerId = await uploadInstagramStory({
//           igUserId: instagramId,
//           accessToken: instagramAccessToken,
//           mediaUrl:
//             (result[0] && result[0].mediaUrls && result[0].mediaUrls[0]) || '',
//           caption: result[0].caption,
//           type: type,
//           contentId: result[0]._id,
//         })

//         console.log('Carousel Container ID:', carouselContainerId)
//       }
//     }

//     if (result[0].templateId) {
//       await ContentTemplate.findByIdAndUpdate(
//         result[0].templateId,
//         { $inc: { 'stats.reuseCount': 1 } },
//         { new: true },
//       )
//     }

//     return result[0]
//     // return result[0]
//   } catch (error: any) {
//     if (error.code === 11000) {
//       throw new ApiError(StatusCodes.CONFLICT, 'Duplicate entry found')
//     }
//     throw error
//   }
// }

// new version

export const createContent = async (
  user: JwtPayload,
  payload: IContent,
): Promise<IContent> => {
  const CONTENT_TYPES = ['post', 'reel', 'carousel', 'story'] as const
  type ContentTypeKeys = (typeof CONTENT_TYPES)[number]
  if (!payload.mediaUrls || payload.mediaUrls.length === 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Media URLs are required to create content.',
    )
  }

  const platforms = payload.platform || []
  const facebook = platforms.includes('facebook')
  const instagram = platforms.includes('instagram')
  const tiktok = platforms.includes('tiktok')
  
  if (!facebook && !instagram && !tiktok) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Please select at least one platform (Facebook , Instagram or Tiktok).',
    )
  }

  // Restrict mediaUrls for single media content
  if (['post', 'reel', 'story'].includes(payload.contentType!)) {
    payload.mediaUrls = payload.mediaUrls.slice(0, 1)
  }

  if (payload.contentType === 'carousel' && payload.mediaUrls.length < 2) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'At least 2 media URLs are required for carousel content.',
    )
  }

  if (payload.contentType === 'reel') {
    const urlType = await detectMediaType(payload.mediaUrls[0])
    if (urlType !== 'video') {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'The provided media is not a video.',
      )
    }
  }

  try {
    await checkAndIncrementUsage(user, payload.contentType as ContentTypeKeys)
    const [createdContent] = await Content.create([payload])

    if (!createdContent) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create content, try again.',
      )
    }

    const caption = buildCaptionWithTags(payload.caption, payload.tags)

    const tasks: Promise<any>[] = []

    if (facebook) tasks.push(postToFacebook(user.authId, createdContent))
    if (instagram) tasks.push(postToInstagram(user.authId, createdContent))

    await Promise.all(tasks)

    // TODO, NEED UNCOMMENTS

    // if (createdContent.templateId) {
    //   await ContentTemplate.findByIdAndUpdate(
    //     createdContent.templateId,
    //     { $inc: { 'stats.reuseCount': 1 } },
    //     { new: true },
    //   )
    // }

    return createdContent
  } catch (error: any) {
    if (error.code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, 'Duplicate entry found')
    }
    throw error
  }
}

// Facebook posting
const postToFacebook = async (userId: string, content: IContent) => {
  const fbAccount = await Socialintegration.findOne({
    user: userId,
    platform: 'facebook',
  })
  if (!fbAccount?.accounts?.length) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'No Facebook account connected.',
    )
  }

  const { pageId, pageAccessToken } = fbAccount.accounts[0]

  let isPublished = true
  let scheduledPublishTime: number | undefined

  if (content.scheduledAt && content.scheduledAt.type === 'single') {
    const { date, time } = content.scheduledAt
    if (date && time) {
      const scheduledDateTime = new Date(date)
      const [hours, minutes] = time.split(':').map(Number)
      scheduledDateTime.setHours(hours, minutes, 0, 0)

      const now = new Date()
      // Facebook requires scheduled_publish_time to be between 10 minutes and 30 days in the future
      const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000)

      if (scheduledDateTime > tenMinutesFromNow) {
        isPublished = false
        scheduledPublishTime = Math.floor(scheduledDateTime.getTime() / 1000)
      }
    }
  }

  switch (content.contentType) {
    case 'post':
      return uploadFacebookPhotoScheduled(
        pageId,
        pageAccessToken,
        content.mediaUrls![0],
        content.caption!,
        content._id!,
        isPublished,
        scheduledPublishTime,
      )
    case 'reel':
      return uploadFacebookReelScheduled(
        pageId,
        pageAccessToken,
        content.mediaUrls![0],
        content.caption!,
        content._id!,
        isPublished,
        scheduledPublishTime,
      )
    case 'carousel':
      return uploadFacebookCarouselScheduled(
        pageId,
        pageAccessToken,
        content.mediaUrls!,
        content.caption!,
        content._id!,
        isPublished,
        scheduledPublishTime,
      )
    case 'story':
      const type = await detectMediaType(content.mediaUrls![0])
      if (type === 'video')
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Facebook stories support images only.',
        )

      if (isPublished) {
        return uploadFacebookStory({
          pageId,
          pageAccessToken,
          mediaUrl: content.mediaUrls![0],
          type,
          caption: content.caption!,
          contentId: content._id,
        })
      } else {
        await Content.findByIdAndUpdate(content._id, {
          $set: { 'platformStatus.facebook': 'pending' },
        })
        return
      }

  }
}


// Instagram posting
const postToInstagram = async (userId: string, content: IContent) => {
  const { instagramId, instagramAccessToken } =
    await getInstagramTokenAndIdFromDB(userId)

  switch (content.contentType) {
    case 'post':
    case 'reel':
      return uploadAndQueueInstagramContent(
        content._id!.toString(),
        instagramId,
        instagramAccessToken,
      )
    case 'carousel':
      return createInstagramCarousel({
        igUserId: instagramId,
        accessToken: instagramAccessToken,
        imageUrls: content.mediaUrls!,
        caption: content.caption!,
        contentId: content._id!,
      })
    case 'story':
      const type = await detectMediaType(content.mediaUrls![0])
      return uploadInstagramStory({
        igUserId: instagramId,
        accessToken: instagramAccessToken,
        mediaUrl: content.mediaUrls![0],
        caption: content.caption!,
        type,
        contentId: content._id,
      })
  }
}

const getAllContents = async (
  user: JwtPayload,
  filterables: IContentFilterables,
  pagination: IPaginationOptions,
) => {
  const { searchTerm, date, ...otherFilters } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const andConditions: any[] = []

  // 🔍 Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: contentSearchableFields.map(field => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      })),
    })
  }

  // 🎯 Single date filtering
  if (date) {
    const target = new Date(date)
    const startOfDay = new Date(target.setHours(0, 0, 0, 0))
    const endOfDay = new Date(target.setHours(23, 59, 59, 999))

    andConditions.push({
      'scheduledAt.date': { $gte: startOfDay, $lte: endOfDay },
    })
  }

  // 🛑 Always exclude deleted
  andConditions.push({
    status: { $nin: [CONTENT_STATUS.DELETED, null] },
  })

  // 🎯 Other filters (status, contentType, etc.)
  if (Object.keys(otherFilters).length) {
    for (const [key, value] of Object.entries(otherFilters)) {
      andConditions.push({ [key]: value })
    }
  }

  const whereConditions = andConditions.length ? { $and: andConditions } : {}

  const [result, total] = await Promise.all([
    Content.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .populate({
        path: 'user',
        select: 'name email verified',
      }),

    Content.countDocuments(whereConditions),
  ])

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: result,
  }
}

const getSingleContent = async (id: string): Promise<IContent> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Content ID')
  }

  const result = await Content.findOne({
    _id: new Types.ObjectId(id),
    status: { $ne: CONTENT_STATUS.DELETED },
  }).populate({
    path: 'user',
    select: 'name email verified',
  })

  const stats = await Stats.findOne({ contentId: result?._id })

  // .populate('facebookAccounts')
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested content not found, please try again with valid id',
    )
  }

  return result
}

const updateContent = async (
  id: string,
  payload: Partial<IContent>,
): Promise<IContent | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Content ID')
  }

  const result = await Content.findByIdAndUpdate(
    new Types.ObjectId(id),
    { $set: payload },
    {
      new: true,
      runValidators: true,
    },
  ).populate({
    path: 'user',
    select: 'name email verified',
  })

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested content not found, please try again with valid id',
    )
  }

  return result
}

const deleteContent = async (
  id: string,
  user: JwtPayload,
): Promise<IContent> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Content ID')
  }

  const isContentExists = await Content.findById(id)
  if (!isContentExists) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Content not found, please try again with valid id.',
    )
  }

  const contentUser = isContentExists?.user?.toString()

  const isUserMatched = contentUser === user.authId

  if (!isUserMatched) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      'You are not authorized to delete this content.',
    )
  }

  const result = await Content.findByIdAndUpdate(
    new Types.ObjectId(id),
    { status: 'deleted', user: new Types.ObjectId(user.authId) },
    { new: true },
  )
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Something went wrong while deleting content, please try again with valid id.',
    )
  }

  return result
}

const duplicateContent = async (
  id: string,
  user: JwtPayload,
): Promise<IContent> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Content ID')
  }

  // 1️⃣ Fetch the original content
  const originalContent = await Content.findOne({
    _id: new Types.ObjectId(id),
    status: { $ne: CONTENT_STATUS.DELETED },
  })

  if (!originalContent) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Content not found or deleted')
  }

  // 2️⃣ Prepare duplicate data
  const duplicatedData = {
    ...originalContent.toObject(),
    _id: undefined, // Remove _id so MongoDB generates a new one
    createdAt: undefined,
    updatedAt: undefined,
    user: new Types.ObjectId(user.authId), // assign new user if needed
    status: CONTENT_STATUS.SCHEDULED, // reset status
    caption: `${originalContent.caption} (Duplicate)`, // add "Duplicate" to caption
  }

  // 3️⃣ Create new content
  const duplicatedContent = await Content.create(duplicatedData)
  return duplicatedContent
}

const getAllMyContents = async (
  user: JwtPayload,
  filterables: IContentFilterables,
  pagination: IPaginationOptions,
) => {
  const { searchTerm, date, ...otherFilters } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const andConditions: any[] = []

  // 🔍 Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: contentSearchableFields.map(field => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      })),
    })
  }

  // 🛑 Always exclude deleted
  andConditions.push({
    status: { $nin: [CONTENT_STATUS.DELETED, null] },
  })

  // ✅ Only current user
  andConditions.push({ user: new Types.ObjectId(user.authId) })

  // 🎯 Other filters (status, contentType, etc.)
  if (Object.keys(otherFilters).length) {
    for (const [key, value] of Object.entries(otherFilters)) {
      andConditions.push({ [key]: value })
    }
  }

  const whereConditions = andConditions.length ? { $and: andConditions } : {}

  const [result, total] = await Promise.all([
    Content.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .populate({
        path: 'user',
        select: 'name email verified',
      }),

    Content.countDocuments(whereConditions),
  ])

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: result,
  }
}

export const ContentServices = {
  createContent,
  getAllContents,
  getSingleContent,
  updateContent,
  deleteContent,
  duplicateContent,
  getAllMyContents,
}
