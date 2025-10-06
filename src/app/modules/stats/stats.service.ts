import { JwtPayload } from 'jsonwebtoken'
import { User } from '../user/user.model'
import ApiError from '../../../errors/ApiError'
import { StatusCodes } from 'http-status-codes'
import { Content } from '../content/content.model'
import { CONTENT_STATUS } from '../content/content.constants'
import { Types } from 'mongoose'

export const getUserContentStats = async (user: JwtPayload) => {
  const stats = await Content.aggregate([
    {
      $match: {
        user: new Types.ObjectId(user.authId),
        status: CONTENT_STATUS.DRAFT,
      },
    },
    {
      $group: {
        _id: '$contentType',
        total: { $sum: 1 },
      },
    },
  ])

  const result = {
    postsPublished: 0,
    reelsPublished: 0,
    storiesCreated: 0,
  }

  for (const item of stats) {
    if (item._id === 'post') result.postsPublished = item.total
    if (item._id === 'reels') result.reelsPublished = item.total
    if (item._id === 'story') result.storiesCreated = item.total
  }

  return result
}

export const StatsService = {
  getUserContentStats,
}
