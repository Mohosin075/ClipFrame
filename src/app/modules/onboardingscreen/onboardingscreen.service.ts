import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IOnboardingscreenFilterables, IOnboardingscreen } from './onboardingscreen.interface';
import { Onboardingscreen } from './onboardingscreen.model';
import { JwtPayload } from 'jsonwebtoken';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { onboardingscreenSearchableFields } from './onboardingscreen.constants';
import { Types } from 'mongoose';
import { S3Helper } from '../../../helpers/image/s3helper';


const createOnboardingscreen = async (
  user: JwtPayload,
  payload: IOnboardingscreen
): Promise<IOnboardingscreen> => {
  try {
    const result = await Onboardingscreen.create(payload);
    if (!result) {

      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to create Onboardingscreen, please try again with valid data.'
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

const getAllOnboardingscreens = async (
  user: JwtPayload,
  filterables: IOnboardingscreenFilterables,
  pagination: IPaginationOptions
) => {
  const { searchTerm, ...filterData } = filterables;
  const { page, skip, limit, sortBy, sortOrder } = paginationHelper.calculatePagination(pagination);

  const andConditions = [];

  // Search functionality
  if (searchTerm) {
    andConditions.push({
      $or: onboardingscreenSearchableFields.map((field) => ({
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
    Onboardingscreen
      .find(whereConditions)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder }),
    Onboardingscreen.countDocuments(whereConditions),
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

const getSingleOnboardingscreen = async (id: string): Promise<IOnboardingscreen> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Onboardingscreen ID');
  }

  const result = await Onboardingscreen.findById(id);
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Requested onboardingscreen not found, please try again with valid id'
    );
  }

  return result;
};



const deleteOnboardingscreen = async (id: string): Promise<IOnboardingscreen> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Onboardingscreen ID');
  }

  const isExistOnboardingScreen = await Onboardingscreen.findById(id);
  if (!isExistOnboardingScreen) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Onboardingscreen not found');
  }

    if (isExistOnboardingScreen.imageURL) {
    const url = new URL(isExistOnboardingScreen.imageURL)
    const key = url.pathname.substring(1)
    await S3Helper.deleteFromS3(key)
  }

  const result = await Onboardingscreen.findByIdAndDelete(id);
  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Something went wrong while deleting onboardingscreen, please try again with valid id.'
    );
  }

  return result;
};

export const OnboardingscreenServices = {
  createOnboardingscreen,
  getAllOnboardingscreens,
  getSingleOnboardingscreen,
  deleteOnboardingscreen,
};
