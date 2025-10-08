import { Request, Response } from 'express'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import pick from '../../../shared/pick'
import { contenttemplateFilterables } from './contenttemplate.constants'
import { paginationFields } from '../../../interfaces/pagination'
import { ContenttemplateServices } from './contenttemplate.service'
import { JwtPayload } from 'jsonwebtoken'

const createContenttemplate = catchAsync(
  async (req: Request, res: Response) => {
    const contenttemplateData = req.body

    const result = await ContenttemplateServices.createContentTemplate(
      req.user!,
      contenttemplateData,
    )

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: 'Contenttemplate created successfully',
      data: result,
    })
  },
)

const updateContenttemplate = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params
    const contenttemplateData = req.body

    const result = await ContenttemplateServices.updateContentTemplate(
      id,
      contenttemplateData,
    )

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Contenttemplate updated successfully',
      data: result,
    })
  },
)

const getSingleContenttemplate = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params
    const result = await ContenttemplateServices.getSingleContentTemplate(id)

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Contenttemplate retrieved successfully',
      data: result,
    })
  },
)

const getAllContenttemplates = catchAsync(
  async (req: Request, res: Response) => {
    const filterables = pick(req.query, contenttemplateFilterables)
    const pagination = pick(req.query, paginationFields)

    const result = await ContenttemplateServices.getAllContentTemplates(
      req.user!,
      filterables,
      pagination,
    )

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Contenttemplates retrieved successfully',
      data: result,
    })
  },
)

const deleteContenttemplate = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params
    const result = await ContenttemplateServices.deleteContentTemplate(id)

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Contenttemplate deleted successfully',
      data: result,
    })
  },
)

const toggleTemplateLove = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const user = req.user as JwtPayload
  const result = await ContenttemplateServices.toggleTemplateLove(
    id,
    user.authId,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Updated Love successfully',
    data: result,
  })
})

const getRecentTemplates = catchAsync(async (req: Request, res: Response) => {
  const filterables = pick(req.query, contenttemplateFilterables)

  const pagination = pick(req.query, paginationFields)

  const result = await ContenttemplateServices.getAllContentTemplates(
    req.user!,
    filterables,
    pagination,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Contenttemplates retrieved successfully',
    data: result,
  })
})

export const ContenttemplateController = {
  createContenttemplate,
  updateContenttemplate,
  getSingleContenttemplate,
  getAllContenttemplates,
  deleteContenttemplate,
  toggleTemplateLove,
  getRecentTemplates,
}
