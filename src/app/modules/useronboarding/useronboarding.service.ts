import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import {
  IUseronboardingFilterables,
  IUseronboarding,
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
  const data = { ...payload, userId: user.authId }

  try {
    const existing = await Useronboarding.findOne({
      userId: user.authId,
    })

    // 🧩 If user onboarding doesn’t exist, create it
    if (!existing) {
      const created = await Useronboarding.create(data)
      return created
    }

    // 🔧 Prepare update fields
    const updateFields: Record<string, any> = {}

    Object.keys(payload).forEach(key => {
      updateFields[key] = (payload as any)[key]
    })

    // Handle all other fields normally
    // Object.keys(payload).forEach(key => {
    //   if (key !== 'socialHandles') {
    //     updateFields[key] = (payload as any)[key]
    //   }
    // })

    // // ⚙️ Handle socialHandles logic
    // if (payload.socialHandles && payload.socialHandles.length > 0) {
    //   const existingHandles = existing.socialHandles || []

    //   for (const handle of payload.socialHandles) {
    //     const alreadyExists = existingHandles.some(
    //       h => h.platform === handle.platform,
    //     )

    //     if (!alreadyExists) {
    //       existingHandles.push(handle)
    //     }
    //   }

    //   updateFields.socialHandles = existingHandles
    // }

    const updated = await Useronboarding.findOneAndUpdate(
      { userId: user.authId },
      { $set: updateFields },
      { new: true },
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

export const UseronboardingServices = {
  createUseronboarding,
  getAllUseronboardings,
  getSingleUseronboarding,
  deleteUseronboarding,
}
