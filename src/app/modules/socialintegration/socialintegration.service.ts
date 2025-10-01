import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import {
  ISocialintegrationFilterables,
  ISocialintegration,
} from './socialintegration.interface'
import { Socialintegration } from './socialintegration.model'
import { JwtPayload } from 'jsonwebtoken'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { socialintegrationSearchableFields } from './socialintegration.constants'
import { Types } from 'mongoose'
import {
  createInstagramMedia,
  getFacebookPages,
  getInstagramAccounts,
  publishInstagramMedia,
} from '../../../helpers/graphAPIHelper'
import { IUser } from '../user/user.interface'

const createSocialintegration = async (
  user: JwtPayload,
  payload: ISocialintegration,
): Promise<ISocialintegration> => {
  try {
    const result = await Socialintegration.create(payload)
    if (!result) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create Socialintegration, please try again with valid data.',
      )
    }

    return result
  } catch (error: any) {
    if (error.code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, 'Duplicate entry found')
    }
    throw error
  }
}

const getAllSocialintegrations = async (
  user: JwtPayload,
  filterables: ISocialintegrationFilterables,
  pagination: IPaginationOptions,
) => {
  console.log({ user })
  const social = await Socialintegration.findOne({
    user: user.authId,
    platform: 'instagram',
  })

  const igBusinessId = '17841443388295568'
  const pageAccessToken =
    'EAATItxj1TL8BPtE8njlPlNFHfxqtruMRf3jxJQQgWW2G1FP0LzYvcn8dIi4L6Ova1zWuudB703KTkvlo0p2D5lYAtJSAI5xZCpmzB0BMZAYn9UD4smlf4TX5pj7h27uQvUgLaQeGSFmWO6JBjrOTVtrl9Yms0mTR4j1RkvnpyhwtTDj5plj7AdPYRZCfVkSSglk2lF3WgVeElOZASULa'
  const videoUrl =
    'https://clipframe.s3.ap-southeast-1.amazonaws.com/videos/1757808619430-7clmu0rg4wo.mp4'
  const imageUrl =
    'https://clipframe.s3.ap-southeast-1.amazonaws.com/image/1759092307709.png'
  const caption = 'Reels 1:47 instagram'
  const scheduledAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
  console.log({ scheduledAt })

  // const containerId = await createInstagramMedia({
  //   igUserId: igBusinessId,
  //   accessToken: pageAccessToken,
  //   mediaUrl: videoUrl,
  //   caption: '🔥 My new reel',
  //   type: 'reel',
  // })



  // console.log(containerId)

  const containerId = '18057275471446277'
  // // Step 2: Publish
  const published = await publishInstagramMedia({
    igUserId: igBusinessId,
    accessToken: pageAccessToken,
    containerId,
    type: 'post',
  })

  console.log({ published })

  const { searchTerm, ...filterData } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const andConditions = []

  // Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: socialintegrationSearchableFields.map(field => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    })
  }

  // Filter functionality
  if (Object.keys(filterData).length) {
    andConditions.push({
      $and: Object.entries(filterData).map(([key, value]) => ({
        [key]: value,
      })),
    })
  }

  const whereConditions = andConditions.length ? { $and: andConditions } : {}

  const [result, total] = await Promise.all([
    Socialintegration.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder }),
    Socialintegration.countDocuments(whereConditions),
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

const getSingleSocialintegration = async (
  id: string,
): Promise<ISocialintegration> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Socialintegration ID')
  }

  const result = await Socialintegration.findById(id)
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested socialintegration not found, please try again with valid id',
    )
  }

  return result
}

const updateSocialintegration = async (
  id: string,
  payload: Partial<ISocialintegration>,
): Promise<ISocialintegration | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Socialintegration ID')
  }

  const result = await Socialintegration.findByIdAndUpdate(
    new Types.ObjectId(id),
    { $set: payload },
    {
      new: true,
      runValidators: true,
    },
  )

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested socialintegration not found, please try again with valid id',
    )
  }

  return result
}

const deleteSocialintegration = async (
  id: string,
): Promise<ISocialintegration> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Socialintegration ID')
  }

  const result = await Socialintegration.findByIdAndDelete(id)
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Something went wrong while deleting socialintegration, please try again with valid id.',
    )
  }

  return result
}

export async function upsertFacebookPages(
  accessToken: string,
  profile: any,
  user: IUser,
) {
  // 1️⃣ Pull the list of FB Pages the user manages
  const pages = await getFacebookPages(accessToken)

  // 2️⃣ Upsert into your Socialintegration collection
  return Socialintegration.findOneAndUpdate(
    { appId: profile.id, platform: 'facebook' },
    {
      user: user._id,
      platform: 'facebook',
      appId: profile.id,
      accessToken,
      accounts: pages,
      metaProfile: {
        email: profile.emails?.[0]?.value,
        name: profile.displayName,
        photo: profile.photos?.[0]?.value,
      },
    },
    { upsert: true, new: true },
  )
}

export async function upsertInstagramAccounts(
  accessToken: string,
  profile: any,
  user: IUser,
) {
  // 1️⃣ Find IG business/creator accounts tied to this FB user
  const igAccounts = await getInstagramAccounts(accessToken)

  console.log('Found IG Accounts:', igAccounts)

  // 2️⃣ Upsert
  return Socialintegration.findOneAndUpdate(
    { appId: profile.id, platform: 'instagram' },
    {
      user: user._id,
      platform: 'instagram',
      appId: profile.id,
      accessToken,
      accounts: igAccounts,
      metaProfile: {
        email: profile.emails?.[0]?.value,
        name: profile.displayName,
        photo: profile.photos?.[0]?.value,
      },
    },
    { upsert: true, new: true },
  )
}

export const SocialintegrationServices = {
  createSocialintegration,
  getAllSocialintegrations,
  getSingleSocialintegration,
  updateSocialintegration,
  deleteSocialintegration,
}
