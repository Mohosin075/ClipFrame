import { Request, Response } from 'express'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import { NotificationServices } from './notifications.service'
import { IPaginationOptions } from '../../../interfaces/pagination'

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
  const paginationOptions: IPaginationOptions = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    sortBy: (req.query.sortBy as string) || 'createdAt',
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
  }
  const result = await NotificationServices.getNotifications(
    req.user!,
    paginationOptions,
  )
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notifications retrieved successfully',
    data: result,
  })
})
const updateNotification = catchAsync(async (req: Request, res: Response) => {
  const notificationId = req.params.id
  const result = await NotificationServices.readNotification(notificationId)
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notifications updated successfully',
    data: result,
  })
})

const updateAllNotifications = catchAsync(
  async (req: Request, res: Response) => {
    const result = await NotificationServices.readAllNotifications(req.user!)
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Notifications updated successfully',
      data: result,
    })
  },
)

export const NotificationController = {
  getMyNotifications,
  updateNotification,
  updateAllNotifications,
}
