import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import {
  IUseronboardingFilterables,
  IUseronboarding,
  TargetAudience,
  ContentLanguage,
} from './useronboarding.interface'
import { JwtPayload } from 'jsonwebtoken'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { useronboardingSearchableFields } from './useronboarding.constants'
import { Types } from 'mongoose'
import { Useronboarding } from './useronboarding.model'

const createUseronboarding = async (
  user: JwtPayload,
  payload: Partial<IUseronboarding> & {
    removeTargetAudience?: TargetAudience[]
    removePreferredLanguages?: ContentLanguage[]
  },
) => {
  const userId = user.authId
  const {
    targetAudience,
    preferredLanguages,
    removeTargetAudience,
    removePreferredLanguages,
    ...otherData
  } = payload

  try {
    const existing = await Useronboarding.findOne({ userId })

    // 🧩 If user onboarding doesn’t exist, create it
    if (!existing) {
      const data = {
        ...otherData,
        userId,
        targetAudience: targetAudience
          ? Array.from(new Set(targetAudience))
          : [],
        preferredLanguages: preferredLanguages
          ? Array.from(new Set(preferredLanguages))
          : [ContentLanguage.EN],
      }
      return await Useronboarding.create(data)
    }

    // 🔧 Prepare update operations
    const updateOps: any = {}

    // 1. $set for regular fields
    if (Object.keys(otherData).length > 0) {
      updateOps.$set = otherData
    }

    // 2. $addToSet for adding new unique options
    const addToSetOps: any = {}
    if (targetAudience && targetAudience.length > 0) {
      addToSetOps.targetAudience = { $each: targetAudience }
    }
    if (preferredLanguages && preferredLanguages.length > 0) {
      addToSetOps.preferredLanguages = { $each: preferredLanguages }
    }
    if (Object.keys(addToSetOps).length > 0) {
      updateOps.$addToSet = addToSetOps
    }

    // 3. $pull for removing existing options
    const pullOps: any = {}
    if (removeTargetAudience && removeTargetAudience.length > 0) {
      pullOps.targetAudience = { $in: removeTargetAudience }
    }
    if (removePreferredLanguages && removePreferredLanguages.length > 0) {
      pullOps.preferredLanguages = { $in: removePreferredLanguages }
    }
    if (Object.keys(pullOps).length > 0) {
      updateOps.$pull = pullOps
    }

    const updated = await Useronboarding.findOneAndUpdate(
      { userId },
      updateOps,
      {
        new: true,
        runValidators: true,
      },
    ).lean()

    if (!updated) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to update onboarding data.',
      )
    }

    return updated
  } catch (error: any) {
    if (error.code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, 'Duplicate entry found')
    }
    throw error
  }
}

const getAllUseronboardings = async (
  user: JwtPayload,
  filterables: IUseronboardingFilterables,
  pagination: IPaginationOptions,
) => {
  const { searchTerm, ...filterData } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const andConditions = []

  // Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: useronboardingSearchableFields.map(field => ({
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
    Useronboarding.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .populate('userId'),
    Useronboarding.countDocuments(whereConditions),
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

const getSingleUseronboarding = async (
  id: string,
): Promise<IUseronboarding> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Useronboarding ID')
  }

  const result = await Useronboarding.findById(id).populate('userId')
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested useronboarding not found, please try again with valid id',
    )
  }

  return result
}

const deleteUseronboarding = async (id: string): Promise<IUseronboarding> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Useronboarding ID')
  }

  const result = await Useronboarding.findByIdAndDelete(id)
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Something went wrong while deleting useronboarding, please try again with valid id.',
    )
  }

  return result
}

const getMyOnboarding = async (
  user: JwtPayload,
): Promise<IUseronboarding | null> => {
  const result = await Useronboarding.findOne({ userId: user.authId }).populate(
    'userId',
  )
  return result
}

const updateMyOnboarding = async (
  user: JwtPayload,
  payload: Partial<IUseronboarding> & {
    removeTargetAudience?: TargetAudience[]
    removePreferredLanguages?: ContentLanguage[]
  },
) => {
  return await createUseronboarding(user, payload)
}

export const UseronboardingServices = {
  createUseronboarding,
  getAllUseronboardings,
  getSingleUseronboarding,
  deleteUseronboarding,
  getMyOnboarding,
  updateMyOnboarding,
}
