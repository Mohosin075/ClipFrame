import { JwtPayload } from 'jsonwebtoken'
import { Content } from '../content/content.model'
import { CONTENT_STATUS } from '../content/content.constants'
import { Types } from 'mongoose'

export const getUserContentStats = async (user: JwtPayload) => {
  const userId = new Types.ObjectId(user.authId)

  // 🟦 Step 1: Basic published counts
  const stats = await Content.aggregate([
    {
      $match: {
        user: userId,
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

  // 🟨 Step 2: Weekly views & engagement for published content
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const engagementStats = await Content.aggregate([
    {
      $match: {
        user: userId,
        status: CONTENT_STATUS.DRAFT,
        createdAt: { $gte: oneWeekAgo },
      },
    },
    {
      // 🧠 Calculate engagement and make sure stats fields are always numbers
      $addFields: {
        stats: {
          likes: { $ifNull: ['$stats.likes', 0] },
          comments: { $ifNull: ['$stats.comments', 0] },
          shares: { $ifNull: ['$stats.shares', 0] },
          views: { $ifNull: ['$stats.views', 0] },
        },
        engagement: {
          $add: [
            { $ifNull: ['$stats.likes', 0] },
            { $ifNull: ['$stats.comments', 0] },
            { $ifNull: ['$stats.shares', 0] },
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: '$stats.views' },
        totalEngagement: { $sum: '$engagement' },
        totalContents: { $sum: 1 },
      },
    },
  ])

  // 🟩 Step 3: Build result object
  const result = {
    postsPublished: 0,
    reelsPublished: 0,
    storiesCreated: 0,
    weeklyViews: 0,
    averageEngagementRate: 0,
  }

  // Fill counts
  for (const item of stats) {
    if (item._id === 'post') result.postsPublished = item.total
    if (item._id === 'reel') result.reelsPublished = item.total
    if (item._id === 'story') result.storiesCreated = item.total
  }

  // Fill engagement data
  if (engagementStats.length > 0) {
    const { totalViews, totalEngagement } = engagementStats[0]
    result.weeklyViews = totalViews || 0

    if (totalViews > 0) {
      result.averageEngagementRate = Number(
        (totalEngagement / totalViews).toFixed(2),
      )
    } else {
      result.averageEngagementRate = 0
    }
  }

  // 📝 Return clean single-layer response
  return result
}

export const StatsService = {
  getUserContentStats,
}
