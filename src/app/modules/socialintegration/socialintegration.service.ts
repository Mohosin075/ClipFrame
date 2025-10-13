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
  console.log({accessToken, profile, user})
  // 1️⃣ Pull the list of FB Pages the user manages
  const pages = await getFacebookPages(accessToken)
  console.log({pages})

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
