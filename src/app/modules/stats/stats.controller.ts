import { Request, Response } from 'express'
import { StatsServices } from './stats.service'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import pick from '../../../shared/pick'
import { statsFilterables } from './stats.constants'
import { paginationFields } from '../../../interfaces/pagination'

const getSingleStats = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await StatsServices.getSingleStats(id)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Stats retrieved successfully',
    data: result,
  })
})

const getAllStatss = catchAsync(async (req: Request, res: Response) => {
  const filterables = pick(req.query, statsFilterables)
  const pagination = pick(req.query, paginationFields)

  const result = await StatsServices.getAllStatss(
    req.user!,
    filterables,
    pagination,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Statss retrieved successfully',
    data: result,
  })
})

export const StatsController = {
  getSingleStats,
  getAllStatss,
}
