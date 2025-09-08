import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { Content } from './content.model'
import { JwtPayload } from 'jsonwebtoken'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { contentSearchableFields } from './content.constants'
import { Types } from 'mongoose'
import { IContent, IContentFilterables } from './content.interface'

const createContent = async (
  user: JwtPayload,
  payload: IContent,
): Promise<IContent> => {
  try {
    const result = await Content.create(payload)
    if (!result) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create Content, please try again with valid data.',
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
    console.log('Filtering by date:', date)
    const target = new Date(date)
    const startOfDay = new Date(target.setHours(0, 0, 0, 0))
    const endOfDay = new Date(target.setHours(23, 59, 59, 999))

    andConditions.push({
      'scheduledAt.date': { $gte: startOfDay, $lte: endOfDay },
    })
  }

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

  const result = await Content.findById(id).populate({
    path: 'user',
    select: 'name email verified',
  })
  // .populate('socialAccounts')
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
  )
    .populate('user')
    .populate('socialAccounts')

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested content not found, please try again with valid id',
    )
  }

  return result
}

const deleteContent = async (id: string): Promise<IContent> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Content ID')
  }

  const result = await Content.findByIdAndDelete(id)
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Something went wrong while deleting content, please try again with valid id.',
    )
  }

  return result
}

export const ContentServices = {
  createContent,
  getAllContents,
  getSingleContent,
  updateContent,
  deleteContent,
}
