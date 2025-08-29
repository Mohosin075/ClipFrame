import { Request, Response } from 'express'
import { OnboardingscreenServices } from './onboardingscreen.service'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import pick from '../../../shared/pick'
import { onboardingscreenFilterables } from './onboardingscreen.constants'
import { paginationFields } from '../../../interfaces/pagination'

const createOnboardingscreen = catchAsync(
  async (req: Request, res: Response) => {
    const payload = req.body
    const result = await OnboardingscreenServices.createOnboardingscreen(
      req.user!,
      payload,
    )

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: 'Onboardingscreen created successfully',
      data: result,
    })
  },
)

const getSingleOnboardingscreen = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params
    const result = await OnboardingscreenServices.getSingleOnboardingscreen(id)

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Onboardingscreen retrieved successfully',
      data: result,
    })
  },
)

const getAllOnboardingscreens = catchAsync(
  async (req: Request, res: Response) => {
    const filterables = pick(req.query, onboardingscreenFilterables)
    const pagination = pick(req.query, paginationFields)

    const result = await OnboardingscreenServices.getAllOnboardingscreens(
      req.user!,
      filterables,
      pagination,
    )

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Onboardingscreens retrieved successfully',
      data: result,
    })
  },
)

const deleteOnboardingscreen = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params
    const result = await OnboardingscreenServices.deleteOnboardingscreen(id)

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Onboardingscreen deleted successfully',
      data: result,
    })
  },
)

export const OnboardingscreenController = {
  createOnboardingscreen,
  getSingleOnboardingscreen,
  getAllOnboardingscreens,
  deleteOnboardingscreen,
}
