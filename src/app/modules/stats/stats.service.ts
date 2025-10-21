import { JwtPayload } from 'jsonwebtoken'
import { Content } from '../content/content.model'
import { CONTENT_STATUS } from '../content/content.constants'
import { Types } from 'mongoose'
import { Stats } from './stats.model'
import { User } from '../user/user.model'
import { USER_ROLES } from '../../../enum/user'
import ApiError from '../../../errors/ApiError'
import { StatusCodes } from 'http-status-codes'
import { IStats } from './stats.interface'
import { IContent } from '../content/content.interface'
import { Socialintegration } from '../socialintegration/socialintegration.model'
import {
  getFacebookPhotoDetails,
  getFacebookVideoFullDetails,
} from '../../../helpers/graphAPIHelper'

const createStats = async (content: IContent, payload: IStats) => {
  // 🧠 Step 1: Verify admin user

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

const getUserContentStats = async (user: JwtPayload) => {
  const userId = new Types.ObjectId(user.authId)

  // 🟦 Step 1: Basic published counts
  const stats = await Content.aggregate([
    {
      $match: {
        user: userId,
        status: CONTENT_STATUS.PUBLISHED,
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
        status: CONTENT_STATUS.PUBLISHED,
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
  getUserContentStats,
  getAllPlatformStats,
}
