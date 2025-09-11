import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../errors/ApiError'
import { IStats } from './stats.interface'
import { Stats } from './stats.model'
import { JwtPayload } from 'jsonwebtoken'
import { IPaginationOptions } from '../../../interfaces/pagination'
import { paginationHelper } from '../../../helpers/paginationHelper'
import { statsSearchableFields } from './stats.constants'
import { Types } from 'mongoose'

const getAllStatss = async (
  user: JwtPayload,
  filterables: any,
  pagination: IPaginationOptions,
) => {
  const { searchTerm, ...filterData } = filterables
  const { page, skip, limit, sortBy, sortOrder } =
    paginationHelper.calculatePagination(pagination)

  const andConditions = []

  // Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: statsSearchableFields.map(field => ({
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
    Stats.find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder }),
    Stats.countDocuments(whereConditions),
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

const getSingleStats = async (id: string): Promise<IStats> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Stats ID')
  }

  const result = await Stats.findById(id)
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested stats not found, please try again with valid id',
    )
  }

  return result
}

export const StatsServices = {
  getAllStatss,
  getSingleStats,
}
