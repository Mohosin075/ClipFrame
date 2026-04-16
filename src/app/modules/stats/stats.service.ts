import { JwtPayload } from 'jsonwebtoken'
import { Content } from '../content/content.model'
import { CONTENT_STATUS } from '../content/content.constants'
import { Types } from 'mongoose'
import { Stats } from './stats.model'
import { User } from '../user/user.model'
import { USER_ROLES, USER_STATUS } from '../../../enum/user'
import ApiError from '../../../errors/ApiError'
import { StatusCodes } from 'http-status-codes'
import { IStats } from './stats.interface'
import { IContent } from '../content/content.interface'
import { Socialintegration } from '../socialintegration/socialintegration.model'
import {
  getFacebookPhotoDetails,
  getFacebookVideoFullDetails,
} from '../../../helpers/graphAPIHelper'
import { Subscription } from '../subscription/subscription.model'
import { ContentTemplate } from '../contenttemplate/contenttemplate.model'

const createStats = async (content: IContent, payload: IStats) => {
  const newStats = await Stats.create(payload)
  return newStats
}

const getAllPlatformStats = async (user: JwtPayload) => {
  const isAdminExist = await User.findOne({
    _id: user.authId,
    role: USER_ROLES.ADMIN,
  })

  if (!isAdminExist) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'No admin user found for the provided ID. Please check and try again',
    )
  }

  const allStats = await Stats.find({})
  return allStats
}

const getAdminDashboardStats = async (user: JwtPayload) => {
  const isAdminExist = await User.findOne({
    _id: user.authId,
    role: USER_ROLES.ADMIN,
  })

  if (!isAdminExist) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'No admin user found for the provided ID. Please check and try again',
    )
  }

  const now = new Date()
  const startOfPeriod = new Date(now.getFullYear(), now.getMonth() - 11, 1)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalUsers,
    activeUsers,
    premiumUserIds,
    newUsers,
    totalSubscriptions,
    revenueAggregation,
    revenueByMonthAggregation,
    templateCategoryAggregation,
  ] = await Promise.all([
    User.countDocuments({ status: { $nin: [USER_STATUS.DELETED] } }),
    User.countDocuments({ status: USER_STATUS.ACTIVE }),
    Subscription.distinct('userId', { status: 'active' }),
    User.countDocuments({
      status: { $nin: [USER_STATUS.DELETED] },
      createdAt: { $gte: startOfMonth },
    }),
    Subscription.countDocuments({ status: 'active' }),
    Subscription.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$price' },
        },
      },
    ]),
    Subscription.aggregate([
      {
        $match: {
          status: 'active',
          createdAt: { $gte: startOfPeriod },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          totalRevenue: { $sum: '$price' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    ContentTemplate.aggregate([
      {
        $match: {
          isActive: true,
        },
      },
      {
        $group: {
          _id: '$category',
          totalTemplates: { $sum: 1 },
        },
      },
      { $sort: { totalTemplates: -1 } },
    ]),
  ])

  const totalRevenue =
    revenueAggregation.length > 0 ? revenueAggregation[0].totalRevenue : 0
  const premiumUsers = Array.isArray(premiumUserIds) ? premiumUserIds.length : 0

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]

  const monthlyRevenue = revenueByMonthAggregation.map(item => {
    const monthIndex = item._id.month - 1
    const monthLabel = monthNames[monthIndex] || String(item._id.month)

    return {
      year: item._id.year,
      month: item._id.month,
      monthLabel,
      totalRevenue: item.totalRevenue,
    }
  })

  const totalTemplates = templateCategoryAggregation.reduce(
    (sum, item) => sum + item.totalTemplates,
    0,
  )

  const templateCategoryBreakdown = templateCategoryAggregation
    .filter(item => item._id)
    .map(item => {
      const percentage =
        totalTemplates > 0
          ? Number(((item.totalTemplates / totalTemplates) * 100).toFixed(2))
          : 0

      return {
        category: item._id,
        totalTemplates: item.totalTemplates,
        percentage,
      }
    })

  return {
    totalUsers,
    premiumUsers,
    activeUsers,
    newUsers,
    totalSubscriptions,
    totalRevenue,
    monthlyRevenue,
    templateCategoryBreakdown,
  }
}

const getAdminUserStats = async (user: JwtPayload) => {
  const isAdminExist = await User.findOne({
    _id: user.authId,
    role: USER_ROLES.ADMIN,
  })

  if (!isAdminExist) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'No admin user found for the provided ID. Please check and try again',
    )
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalUsers, activeUsers, premiumUserIds, newUsers] = await Promise.all(
    [
      User.countDocuments({ status: { $nin: [USER_STATUS.DELETED] } }),
      User.countDocuments({ status: USER_STATUS.ACTIVE }),
      Subscription.distinct('userId', { status: 'active' }),
      User.countDocuments({
        status: { $nin: [USER_STATUS.DELETED] },
        createdAt: { $gte: startOfMonth },
      }),
    ],
  )

  const premiumUsers = Array.isArray(premiumUserIds) ? premiumUserIds.length : 0

  return {
    totalUsers,
    premiumUsers,
    activeUsers,
    newUsers,
  }
}

const getUserMetrics = async (user: JwtPayload) => {
  const userId = new Types.ObjectId(user.authId)

  // 🟦 Step 1: Counts for all content types and statuses
  const counts = await Content.aggregate([
    {
      $match: {
        user: userId,
        status: { $ne: CONTENT_STATUS.DELETED },
      },
    },
    {
      $group: {
        _id: {
          contentType: '$contentType',
          status: '$status',
        },
        count: { $sum: 1 },
      },
    },
  ])

  // 🟨 Step 2: Performance stats for published content
  const performanceStats = await Stats.aggregate([
    {
      $match: {
        user: userId,
      },
    },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: '$likes' },
        totalComments: { $sum: '$comments' },
        totalShares: { $sum: '$shares' },
        totalViews: { $sum: '$views' },
        totalReach: { $sum: '$reach' },
      },
    },
  ])

  // 🟩 Step 3: Format the response
  const result = {
    contentCreation: {
      posts: { total: 0, published: 0, draft: 0, scheduled: 0 },
      reels: { total: 0, published: 0, draft: 0, scheduled: 0 },
      stories: { total: 0, published: 0, draft: 0, scheduled: 0 },
      carousel: { total: 0, published: 0, draft: 0, scheduled: 0 },
    },
    performance: {
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalReach: 0,
      avgEngagementRate: 0,
    },
  }

  // Map counts
  for (const item of counts) {
    const type = item._id.contentType as 'post' | 'reel' | 'story' | 'carousel'
    const status = item._id.status as string
    const count = item.count

    if (
      result.contentCreation[
        (type + 's') as keyof typeof result.contentCreation
      ]
    ) {
      const typeKey = (type + 's') as keyof typeof result.contentCreation
      result.contentCreation[typeKey].total += count
      if (status === CONTENT_STATUS.PUBLISHED)
        result.contentCreation[typeKey].published += count
      if (status === CONTENT_STATUS.DRAFT)
        result.contentCreation[typeKey].draft += count
      if (status === CONTENT_STATUS.SCHEDULED)
        result.contentCreation[typeKey].scheduled += count
    }
  }

  // Map performance
  if (performanceStats.length > 0) {
    const p = performanceStats[0]
    result.performance.totalViews = p.totalViews || 0
    result.performance.totalLikes = p.totalLikes || 0
    result.performance.totalComments = p.totalComments || 0
    result.performance.totalShares = p.totalShares || 0
    result.performance.totalReach = p.totalReach || 0

    const totalEngagement =
      result.performance.totalLikes +
      result.performance.totalComments +
      result.performance.totalShares

    if (result.performance.totalViews > 0) {
      result.performance.avgEngagementRate = Number(
        (totalEngagement / result.performance.totalViews).toFixed(2),
      )
    }
  }

  return result
}

export const updateFacebookContentStats = async () => {
  let isRunning = false
  if (isRunning) return console.log('⏳ Previous job still running...')
  isRunning = true

  console.log('🕐 Running Facebook content stats update...')

  try {
    // Fetch all published Facebook contents
    const contents = await Content.find({
      status: CONTENT_STATUS.PUBLISHED,
      platform: { $in: ['facebook'] },
    })

    for (const item of contents) {
      const containerId = item.facebookContainerId

      const fbAccount = await Socialintegration.findOne({
        user: item.user,
        platform: 'facebook',
      })
      if (!fbAccount?.accounts?.length) continue

      const { pageAccessToken } = fbAccount.accounts[0]
      if (!pageAccessToken) continue

      try {
        let payload: IStats

        if (item.contentType === 'reel') {
          // Reels-specific payload
          const fbData = await getFacebookVideoFullDetails(
            containerId,
            pageAccessToken,
          )
          payload = {
            user: item.user as unknown as Types.ObjectId,
            contentId: item._id,
            platform: 'facebook',
            likes: fbData.likesCount ?? 0,
            comments: fbData.commentsCount ?? 0,
            shares: fbData.insights?.total_video_shares ?? 0,
            views: fbData.insights?.total_video_views ?? 0,
            // You can add reel-specific stats if needed, e.g. completionRate
          }
        } else if (item.contentType === 'post') {
          // Post-specific payload
          const fbData = await getFacebookPhotoDetails(
            containerId,
            pageAccessToken,
          )
          payload = {
            user: item.user as unknown as Types.ObjectId,
            contentId: item._id,
            platform: 'facebook',
            likes: fbData.likesCount ?? 0,
            comments: fbData.commentsCount ?? 0,
            shares: fbData.sharesCount ?? 0,
            views: fbData.impressions ?? 0,
            // You can add post-specific stats if needed, e.g. saves
          }
        } else {
          continue // skip other content types
        }

        // Upsert stats
        await Stats.findOneAndUpdate(
          { contentId: item._id, platform: 'facebook', user: item.user },
          payload,
          { upsert: true, new: true },
        )

        console.log(`✅ Updated stats for content: ${item._id}`)
      } catch (err) {
        console.error(`❌ Error fetching FB data for ${item._id}:`, err)
      }
    }

    console.log('✨ Facebook stats update completed.')
  } catch (err) {
    console.error('❌ Error updating Facebook stats:', err)
  } finally {
    isRunning = false
  }
}

export const StatsService = {
  createStats,
  getUserMetrics,
  getAllPlatformStats,
  getAdminDashboardStats,
  getAdminUserStats,
}
