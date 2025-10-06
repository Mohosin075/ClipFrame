import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IContenttemplateFilterables, IContenttemplate } from './contenttemplate.interface';
import { Contenttemplate } from './contenttemplate.model';
import { JwtPayload } from 'jsonwebtoken';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { contenttemplateSearchableFields } from './contenttemplate.constants';
import { Types } from 'mongoose';


const createContenttemplate = async (
  user: JwtPayload,
  payload: IContenttemplate
): Promise<IContenttemplate> => {
  try {
    const result = await Contenttemplate.create(payload);
    if (!result) {
      
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create Contenttemplate, please try again with valid data.'
      );
    }

    return result;
  } catch (error: any) {
    
    if (error.code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, 'Duplicate entry found');
    }
    throw error;
  }
};

const getAllContenttemplates = async (
  user: JwtPayload,
  filterables: IContenttemplateFilterables,
  pagination: IPaginationOptions
) => {
  const { searchTerm, ...filterData } = filterables;
  const { page, skip, limit, sortBy, sortOrder } = paginationHelper.calculatePagination(pagination);

  const andConditions = [];

  // Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: contenttemplateSearchableFields.map((field) => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    });
  }

  // Filter functionality
  if (Object.keys(filterData).length) {
    andConditions.push({
      $and: Object.entries(filterData).map(([key, value]) => ({
        [key]: value,
      })),
    });
  }

  const whereConditions = andConditions.length ? { $and: andConditions } : {};

  const [result, total] = await Promise.all([
    Contenttemplate
      .find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder }).populate('createdBy'),
    Contenttemplate.countDocuments(whereConditions),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data: result,
  };
};

const getSingleContenttemplate = async (id: string): Promise<IContenttemplate> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Contenttemplate ID');
  }

  const result = await Contenttemplate.findById(id).populate('createdBy');
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested contenttemplate not found, please try again with valid id'
    );
  }

  return result;
};

const updateContenttemplate = async (
  id: string,
  payload: Partial<IContenttemplate>
): Promise<IContenttemplate | null> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Contenttemplate ID');
  }

  const result = await Contenttemplate.findByIdAndUpdate(
    new Types.ObjectId(id),
    { $set: payload },
    {
      new: true,
      runValidators: true,
    }
  ).populate('createdBy');

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested contenttemplate not found, please try again with valid id'
    );
  }

  return result;
};

const deleteContenttemplate = async (id: string): Promise<IContenttemplate> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Contenttemplate ID');
  }

  const result = await Contenttemplate.findByIdAndDelete(id);
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Something went wrong while deleting contenttemplate, please try again with valid id.'
    );
  }

  return result;
};

export const ContenttemplateServices = {
  createContenttemplate,
  getAllContenttemplates,
  getSingleContenttemplate,
  updateContenttemplate,
  deleteContenttemplate,
};