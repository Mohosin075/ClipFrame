import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { Content } from './content.model'
import { JwtPayload } from 'jsonwebtoken'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { CONTENT_STATUS, contentSearchableFields } from './content.constants'
import { Types } from 'mongoose'
import { ContentType, IContent, IContentFilterables } from './content.interface'
import { checkAndIncrementUsage } from '../subscription/checkSubscription'

const createContent = async (
  user: JwtPayload,
  payload: IContent,
): Promise<IContent> => {
  const result = await checkAndIncrementUsage(
    user,
    payload.contentType as ContentType,
  )

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
    title: `${originalContent.title} (Duplicate)`, // add "Duplicate" to title
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
