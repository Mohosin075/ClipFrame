import { Request, Response } from 'express'
import { ContentServices } from './content.service'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import pick from '../../../shared/pick'
import { contentFilterables } from './content.constants'
import { paginationFields } from '../../../interfaces/pagination'
import { JwtPayload } from 'jsonwebtoken'

const createContent = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user as JwtPayload

  const contentData = { ...req.body, user: userId.authId }

  const result = await ContentServices.createContent(req.user!, contentData)

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Content created successfully',
    data: result,
  })
})

const updateContent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const contentData = req.body

  const result = await ContentServices.updateContent(id, contentData)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Content updated successfully',
    data: result,
  })
})

const getSingleContent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await ContentServices.getSingleContent(id)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Content retrieved successfully',
    data: result,
  })
})

const getAllContents = catchAsync(async (req: Request, res: Response) => {
  const filterables = pick(req.query, contentFilterables)
  const pagination = pick(req.query, paginationFields)

  const result = await ContentServices.getAllContents(
    req.user!,
    filterables,
    pagination,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Contents retrieved successfully',
    data: result,
  })
})

const deleteContent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const userId = req.user as JwtPayload

  const result = await ContentServices.deleteContent(id, userId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Content deleted successfully',
    data: result,
  })
})

const duplicateContent = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const userId = req.user as JwtPayload

  const result = await ContentServices.duplicateContent(id, userId)

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Content duplicated successfully',
    data: result,
  })
})

const getAllMyContents = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user as JwtPayload
  const filterables = pick(req.query, contentFilterables)
  const pagination = pick(req.query, paginationFields)

  const result = await ContentServices.getAllMyContents(
    userId,
    filterables,
    pagination,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Contents retrieved successfully',
    data: result,
  })
})

export const ContentController = {
  createContent,
  updateContent,
  getSingleContent,
  getAllContents,
  deleteContent,
  duplicateContent,
  getAllMyContents,
}
