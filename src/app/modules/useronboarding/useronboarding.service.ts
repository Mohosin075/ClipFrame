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
  payload: Partial<IUseronboarding>,
) => {
  const userId = user.authId
  const { targetAudience, preferredLanguages, ...otherData } = payload

  try {
    const existing = await Useronboarding.findOne({ userId })

    // 🧩 If user onboarding doesn’t exist, create it
    if (!existing) {
      const data = {
        ...otherData,
        userId,
        targetAudience: targetAudience || [],
        preferredLanguages: preferredLanguages || [ContentLanguage.EN],
      }
      return await Useronboarding.create(data)
    }

    // 🔧 Prepare update operations
    const updateOps: any = {
      $set: {
        ...otherData,
      },
    }

    if (targetAudience) {
      updateOps.$set.targetAudience = targetAudience
    }

    if (preferredLanguages) {
      updateOps.$set.preferredLanguages = preferredLanguages
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
  payload: Partial<IUseronboarding>,
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
