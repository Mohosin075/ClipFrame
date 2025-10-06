import { Request, Response } from 'express';
import { ContenttemplateServices } from './contenttemplate.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import pick from '../../../shared/pick';
import { contenttemplateFilterables } from './contenttemplate.constants';
import { paginationFields } from '../../../interfaces/pagination';

const createContenttemplate = catchAsync(async (req: Request, res: Response) => {
  const contenttemplateData = req.body;

  const result = await ContenttemplateServices.createContenttemplate(
    req.user!,
    contenttemplateData
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Contenttemplate created successfully',
    data: result,
  });
});

const updateContenttemplate = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const contenttemplateData = req.body;

  const result = await ContenttemplateServices.updateContenttemplate(id, contenttemplateData);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Contenttemplate updated successfully',
    data: result,
  });
});

const getSingleContenttemplate = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ContenttemplateServices.getSingleContenttemplate(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Contenttemplate retrieved successfully',
    data: result,
  });
});

const getAllContenttemplates = catchAsync(async (req: Request, res: Response) => {
  const filterables = pick(req.query, contenttemplateFilterables);
  const pagination = pick(req.query, paginationFields);

  const result = await ContenttemplateServices.getAllContenttemplates(
    req.user!,
    filterables,
    pagination
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Contenttemplates retrieved successfully',
    data: result,
  });
});

const deleteContenttemplate = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ContenttemplateServices.deleteContenttemplate(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Contenttemplate deleted successfully',
    data: result,
  });
});

export const ContenttemplateController = {
  createContenttemplate,
  updateContenttemplate,
  getSingleContenttemplate,
  getAllContenttemplates,
  deleteContenttemplate,
};