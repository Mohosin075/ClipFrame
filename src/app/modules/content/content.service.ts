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
  getInstagramTokenAndIdFromDB,
  uploadAndQueueInstagramContent,
  uploadFacebookCarouselScheduled,
  uploadFacebookPhotoScheduled,
  uploadFacebookReelScheduled,
} from '../../../helpers/graphAPIHelper'
import { ContentTemplate } from '../contenttemplate/contenttemplate.model'

export const createContent = async (
  user: JwtPayload,
  payload: IContent,
): Promise<IContent> => {
  // const contentUrl =
  //   'https://clipframe.s3.ap-southeast-1.amazonaws.com/videos/1757808619430-7clmu0rg4wo.mp4'
  // payload.mediaUrls = [contentUrl]

  if (!payload.mediaUrls || payload.mediaUrls.length === 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Media URLs are required to create content.',
    )
  }

  let facebook, instagram
  if (payload.platform) {
    facebook = payload.platform.includes('facebook')
    instagram = payload.platform.includes('instagram')
  }

  // if (!facebook && !instagram) {
  //   throw new ApiError(
  //     StatusCodes.BAD_REQUEST,
  //     'Please select at least one platform (Facebook or Instagram) to publish the content.',
  //   )
  // }

  if (
    (payload.contentType === 'post' ||
      payload.contentType === 'reels' ||
      payload.contentType === 'story') &&
    Array.isArray(payload.mediaUrls)
  ) {
    payload.mediaUrls = payload.mediaUrls.slice(0, 1)
  }

  if (payload.contentType === 'carousel') {
    if (payload.mediaUrls.length < 2) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'At least 2 media URLs are required for carousel content.',
      )
    }
  }

  try {
    // Check and increment usage inside the session
    await checkAndIncrementUsage(user, payload.contentType as ContentType)

    // Create content inside the same session
    // const result = await Content.create(payload) // note the array form
    const result = await Content.create([payload]) // note the array form

    if (!result || result.length === 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create Content, please try again with valid data.',
      )
    }

    const caption = buildCaptionWithTags(payload?.caption, payload?.tags)

    // }

    if (facebook) {
      console.log('hit facebook')
      const facebookAccount = await Socialintegration.findOne({
        user: user.authId,
        platform: 'facebook',
      })

      if (
        !facebookAccount ||
        !facebookAccount.accounts ||
        facebookAccount.accounts.length === 0
      ) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'No Facebook social account found, please connect your Facebook account first.',
        )
      }

      if (facebookAccount && facebookAccount?.accounts?.length > 0) {
        const pageId = facebookAccount.accounts[0].pageId
        const pageAccessToken = facebookAccount.accounts[0].pageAccessToken!

        if (payload.contentType === 'post') {
          const published = await uploadFacebookPhotoScheduled(
            pageId,
            pageAccessToken,
            payload.mediaUrls![0],
            caption,
          )
          console.log('Published to Facebook Page:', published)
          if (!published) {
            throw new ApiError(
              StatusCodes.BAD_REQUEST,
              'Failed to schedule Facebook post, please try again.',
            )
          }
        } else if (payload.contentType === 'reels') {
          const reelsPublished = await uploadFacebookReelScheduled(
            pageId,
            pageAccessToken,
            payload.mediaUrls![0],
            caption,
          )
          console.log('Published to Facebook Page:', reelsPublished)
          if (!reelsPublished) {
            throw new ApiError(
              StatusCodes.BAD_REQUEST,
              'Failed to schedule Facebook reel, please try again.',
            )
          }
        } else if (payload.contentType === 'carousel') {
          const carouselPublished = await uploadFacebookCarouselScheduled(
            pageId,
            pageAccessToken,
            payload.mediaUrls!,
            caption,
          )
          console.log('Published to Facebook Page:', carouselPublished)
          if (!carouselPublished) {
            throw new ApiError(
              StatusCodes.BAD_REQUEST,
              'Failed to schedule Facebook carousel, please try again.',
            )
          }
        }
      }
    }

    if (instagram) {
      console.log('hit instagram')

      // get Id and token from DB
      const { instagramId, instagramAccessToken } =
        await getInstagramTokenAndIdFromDB(user.authId)

      if (payload.contentType === 'post' || payload.contentType === 'reels') {
        console.log('hit post')
        const containerId = await uploadAndQueueInstagramContent(
          result[0]._id.toString(),
          instagramId,
          instagramAccessToken,
        )
        console.log(containerId)
      }
      if (payload.contentType === 'carousel') {
        console.log('hit post')
        const containerId = await uploadAndQueueInstagramContent(
          result[0]._id.toString(),
          instagramId,
          instagramAccessToken,
        )
        console.log(containerId)
      }
    }

    if (result[0].templateId) {
      const updateTEmp = await ContentTemplate.findByIdAndUpdate(
        result[0].templateId,
        { $inc: { 'stats.reuseCount': 1 } },
        { new: true },
      )
    }

    return result[0]
    // return result[0]
  } catch (error: any) {
    if (error.code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, 'Duplicate entry found')
    }
    throw error
  }
}

const getAllContents = async (
  user: JwtPayload,
  filterables: IContentFilterables,
  pagination: IPaginationOptions,
) => {
  const photoId = '122105534763022104'
  const pageId = '823267804193695'
  const pageAccessToken =
    'EAATItxj1TL8BPplgyghpsxBaKrxukEkmWvNVKaE2EsnbkLDeQ8QBwYpPyc1wD7e1JZB12CI8kX31LBXEz7XblgEr5SYzr10zIcJ2ffdTr9uypBXKoC7HT0azEs83onsQV9CVon6H92YYEsVS4rgCYXUUPB2WslctJ0eXsPqJQHZCzwn2qmMiJADrl7D9mp81AffoFZCp4lFrhk5frZB6'

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
