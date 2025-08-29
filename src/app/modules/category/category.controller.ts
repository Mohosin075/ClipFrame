import { Request, Response } from 'express';
import { CategoryServices } from './category.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import pick from '../../../shared/pick';
import { categoryFilterables } from './category.constants';
import { paginationFields } from '../../../interfaces/pagination';

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const categoryData = req.body;

  const result = await CategoryServices.createCategory(
    req.user!,
    categoryData
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Category created successfully',
    data: result,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const categoryData = req.body;

  const result = await CategoryServices.updateCategory(id, categoryData);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Category updated successfully',
    data: result,
  });
});

const getSingleCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CategoryServices.getSingleCategory(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Category retrieved successfully',
    data: result,
  });
});

const getAllCategorys = catchAsync(async (req: Request, res: Response) => {
  const filterables = pick(req.query, categoryFilterables);
  const pagination = pick(req.query, paginationFields);

  const result = await CategoryServices.getAllCategorys(
    req.user!,
    filterables,
    pagination
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Categorys retrieved successfully',
    data: result,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CategoryServices.deleteCategory(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Category deleted successfully',
    data: result,
  });
});

export const CategoryController = {
  createCategory,
  updateCategory,
  getSingleCategory,
  getAllCategorys,
  deleteCategory,
};