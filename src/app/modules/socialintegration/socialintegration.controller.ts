import { Request, Response } from 'express';
import { SocialintegrationServices } from './socialintegration.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import pick from '../../../shared/pick';
import { socialintegrationFilterables } from './socialintegration.constants';
import { paginationFields } from '../../../interfaces/pagination';

const createSocialintegration = catchAsync(async (req: Request, res: Response) => {
  const socialintegrationData = req.body;

  const result = await SocialintegrationServices.createSocialintegration(
    req.user!,
    socialintegrationData
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Socialintegration created successfully',
    data: result,
  });
});

const updateSocialintegration = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const socialintegrationData = req.body;

  const result = await SocialintegrationServices.updateSocialintegration(id, socialintegrationData);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Socialintegration updated successfully',
    data: result,
  });
});

const getSingleSocialintegration = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SocialintegrationServices.getSingleSocialintegration(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Socialintegration retrieved successfully',
    data: result,
  });
});

const getAllSocialintegrations = catchAsync(async (req: Request, res: Response) => {
  const filterables = pick(req.query, socialintegrationFilterables);
  const pagination = pick(req.query, paginationFields);

  const result = await SocialintegrationServices.getAllSocialintegrations(
    req.user!,
    filterables,
    pagination
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Socialintegrations retrieved successfully',
    data: result,
  });
});

const deleteSocialintegration = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SocialintegrationServices.deleteSocialintegration(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Socialintegration deleted successfully',
    data: result,
  });
});

export const SocialintegrationController = {
  createSocialintegration,
  updateSocialintegration,
  getSingleSocialintegration,
  getAllSocialintegrations,
  deleteSocialintegration,
};