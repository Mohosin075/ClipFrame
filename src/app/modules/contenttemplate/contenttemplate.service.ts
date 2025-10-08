import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import {
  IContenttemplate,
  IContenttemplateFilterables,
} from './contenttemplate.interface'
import { JwtPayload } from 'jsonwebtoken'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { contenttemplateSearchableFields } from './contenttemplate.constants'
import { Types } from 'mongoose'
import { ContentTemplate } from './contenttemplate.model'
import { User } from '../user/user.model'

const createContentTemplate = async (
  user: JwtPayload,
  payload: IContenttemplate,
): Promise<IContenttemplate> => {
  try {
    const result = await ContentTemplate.create({
      ...payload,
      createdBy: user.authId,
    })
    if (!result) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create ContentTemplate, please try again with valid data.',
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

const getAllContentTemplates = async (
  user: JwtPayload,
  filterables: IContenttemplateFilterables,
  pagination: IPaginationOptions,
) => {
  const { searchTerm, ...filterData } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const andConditions = []

  // Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: contenttemplateSearchableFields.map(field => ({
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
    ContentTemplate.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .populate({
        path: 'createdBy',
        select: 'email profile name',
      }),
    ContentTemplate.countDocuments(whereConditions),
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

const getSingleContentTemplate = async (
  id: string,
): Promise<IContenttemplate> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid ContentTemplate ID')
  }

  const result = await ContentTemplate.findById(id).populate('createdBy')
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested contenttemplate not found, please try again with valid id',
    )
  }

  return result
}

const updateContentTemplate = async (
  id: string,
  payload: Partial<IContenttemplate>,
): Promise<IContenttemplate | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid ContentTemplate ID')
  }

  const result = await ContentTemplate.findByIdAndUpdate(
    new Types.ObjectId(id),
    { $set: payload },
    {
      new: true,
      runValidators: true,
    },
  ).populate('createdBy')

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested contenttemplate not found, please try again with valid id',
    )
  }

  return result
}

const deleteContentTemplate = async (id: string): Promise<IContenttemplate> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid ContentTemplate ID')
  }

  const result = await ContentTemplate.findByIdAndDelete(id)
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Something went wrong while deleting contenttemplate, please try again with valid id.',
    )
  }

  return result
}

const toggleTemplateLove = async (templateId: string, userId: string) => {
  const template = await ContentTemplate.findById(templateId)

  if (!template) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Content template not found.')
  }

  const userObjectId = new Types.ObjectId(userId)
  const alreadyLoved = template.stats.lovedBy
    .map(id => id.toString())
    .includes(userId.toString())

  const updateQuery = alreadyLoved
    ? {
        $pull: { 'stats.lovedBy': userObjectId },
        $inc: { 'stats.loveCount': -1 },
      }
    : {
        $addToSet: { 'stats.lovedBy': userObjectId },
        $inc: { 'stats.loveCount': 1 },
      }

  const updatedTemplate = await ContentTemplate.findByIdAndUpdate(
    templateId,
    updateQuery,
    { new: true },
  )

  return updatedTemplate
}

const getRecentTemplates = async (
  user: JwtPayload,
  filterables: IContenttemplateFilterables,
  pagination: IPaginationOptions,
) => {
  const { searchTerm, ...filterData } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const andConditions = []

  // Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: contenttemplateSearchableFields.map(field => ({
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
    ContentTemplate.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder })
      .populate({
        path: 'createdBy',
        select: 'email profile name',
      }),
    ContentTemplate.countDocuments(whereConditions),
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

export const ContenttemplateServices = {
  createContentTemplate,
  getAllContentTemplates,
  getSingleContentTemplate,
  updateContentTemplate,
  deleteContentTemplate,
  toggleTemplateLove,
  getRecentTemplates,
}
