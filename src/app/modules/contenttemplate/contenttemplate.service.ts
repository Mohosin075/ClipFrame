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

const createContentTemplate = async (
  user: JwtPayload,
  payload: IContenttemplate,
): Promise<IContenttemplate> => {
  try {
    const result = await ContentTemplate.create({
      ...payload,
      user: user.authId,
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
      .populate('createdBy'),
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

export const ContenttemplateServices = {
  createContentTemplate,
  getAllContentTemplates,
  getSingleContentTemplate,
  updateContentTemplate,
  deleteContentTemplate,
}
