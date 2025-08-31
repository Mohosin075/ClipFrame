import { Request, Response } from 'express'
import { UseronboardingServices } from './useronboarding.service'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import pick from '../../../shared/pick'
import { useronboardingFilterables } from './useronboarding.constants'
import { paginationFields } from '../../../interfaces/pagination'

const createUseronboarding = catchAsync(async (req: Request, res: Response) => {
  const useronboardingData = req.body

  console.log({ useronboardingData })

  const result = await UseronboardingServices.createUseronboarding(
    req.user!,
    useronboardingData,
  )

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Useronboarding created successfully',
    data: result,
  })
})

const getSingleUseronboarding = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params
    const result = await UseronboardingServices.getSingleUseronboarding(id)

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Useronboarding retrieved successfully',
      data: result,
    })
  },
)

const getAllUseronboardings = catchAsync(
  async (req: Request, res: Response) => {
    const filterables = pick(req.query, useronboardingFilterables)
    const pagination = pick(req.query, paginationFields)

    const result = await UseronboardingServices.getAllUseronboardings(
      req.user!,
      filterables,
      pagination,
    )

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Useronboardings retrieved successfully',
      data: result,
    })
  },
)

const deleteUseronboarding = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await UseronboardingServices.deleteUseronboarding(id)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Useronboarding deleted successfully',
    data: result,
  })
})

export const UseronboardingController = {
  createUseronboarding,
  getSingleUseronboarding,
  getAllUseronboardings,
  deleteUseronboarding,
}
