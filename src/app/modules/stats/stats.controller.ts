import { Request, Response } from 'express'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { StatsService } from './stats.service'
import { StatusCodes } from 'http-status-codes'
import { JwtPayload } from 'jsonwebtoken'

const getAllPlatformStats = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const result = await StatsService.getAllPlatformStats(user)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User Stats retrieved successfully',
    data: result,
  })
})

const getUserStats = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const result = await StatsService.getUserContentStats(user)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User Stats retrieved successfully',
    data: result,
  })
})

const getAdminDashboardStats = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload
    const result = await StatsService.getAdminDashboardStats(user)

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Admin dashboard stats retrieved successfully',
      data: result,
    })
  },
)
const getAdminUserStats = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const result = await StatsService.getAdminUserStats(user)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Admin user stats retrieved successfully',
    data: result,
  })
})

export const StatsController = {
  getUserStats,
  getAllPlatformStats,
  getAdminUserStats,
  getAdminDashboardStats,
}
