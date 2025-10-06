import { Request, Response } from 'express'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { StatsService } from './stats.service'
import { StatusCodes } from 'http-status-codes'
import { JwtPayload } from 'jsonwebtoken'

const getUserStats = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const result = await StatsService.getUserContentStats(user)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Socialintegration retrieved successfully',
    data: result,
  })
})

export const StatsController = { getUserStats }
