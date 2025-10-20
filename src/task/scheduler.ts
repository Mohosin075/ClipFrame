import cron from 'node-cron'
import { Content } from '../app/modules/content/content.model'
import { CONTENT_STATUS } from '../app/modules/content/content.constants'
import { logger } from '../shared/logger'
import { sendNotification } from '../helpers/notificationHelper'
import config from '../config'
import { User } from '../app/modules/user/user.model'
import { Socialintegration } from '../app/modules/socialintegration/socialintegration.model'
import ApiError from '../errors/ApiError'
import { StatusCodes } from 'http-status-codes'
import {
  getFacebookPhotoDetails,
  getFacebookVideoFullDetails,
} from '../helpers/graphAPIHelper'
// import { publisheReels } from '../helpers/graphAPIHelper'

// // ────────────────────────────────
// Cron job: runs every 5 minutes only update status scheduled data
// ────────────────────────────────
cron.schedule('*/5 * * * *', async () => {
  console.log('🕐 Running content status update job...')

  try {
    // Only get contents that are SCHEDULED (not yet published)
    const contents = await Content.find({
      status: CONTENT_STATUS.SCHEDULED,
    })

    for (const item of contents) {
      const platformStatus = item.platformStatus || new Map()

      // Check if all platforms are marked as "published"
      const allPublished =
        platformStatus.size > 0 &&
        Array.from(platformStatus.values()).every(
          status => status === 'published',
        )

      if (allPublished) {
        item.status = CONTENT_STATUS.PUBLISHED
        await item.save()
        console.log(`✅ Marked as published: ${item._id}`)
      }
    }

    console.log('✨ Content status check completed.')
  } catch (err) {
    console.error('❌ Error running cron job:', err)
  }
})

// Run every 1 hour
cron.schedule('0 * * * *', async () => {
  console.log('🕐 Running Facebook content stats update job...')

  try {
    // Only fetch stats for published FB videos
    const contents = await Content.find({
      status: CONTENT_STATUS.PUBLISHED,
      platform: { $in: ['facebook'] }, // <-- checks if 'facebook' exists in the array
    })

    // console.log({ contents })

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
        if (item.contentType === 'reel') {
          const fbData = await getFacebookVideoFullDetails(
            containerId,
            pageAccessToken,
          )

          // Update stats in your model
          item.stats = {
            likes: fbData.likesCount ?? 0,
            comments: fbData.commentsCount ?? 0,
            shares: fbData.insights.total_video_shares ?? 0,
            views: fbData.insights.total_video_views ?? 0,
          }

          await item.save()
        }

        if (item.contentType === 'post') {
          const fbData = await getFacebookPhotoDetails(
            containerId,
            pageAccessToken,
          )

          // Update stats in your model
          item.stats = {
            likes: fbData.likesCount ?? 0,
            comments: fbData.commentsCount ?? 0,
            shares: fbData.sharesCount ?? 0,
            views: fbData.impressions ?? 0,
          }

          await item.save()
        }

        console.log(`✅ Updated stats for content: ${item._id}`)
      } catch (err) {
        console.error(`❌ Error fetching FB data for ${item._id}:`, err)
      }
    }

    console.log('✨ Facebook stats update completed.')
  } catch (err) {
    console.error('❌ Error running FB stats cron job:', err)
  }
})

// old code
// Run every minute
// cron.schedule('* * * * *', async () => {
//   console.log('Scheduler running... ⏰')
//   const now = new Date()

//   // Local date (YYYY-MM-DD)
//   const currentDateStr = now.toLocaleDateString('en-CA') // outputs "2025-09-08"

//   // Local time (HH:mm)
//   const currentTimeStr = now.toLocaleTimeString('en-GB', {
//     hour: '2-digit',
//     minute: '2-digit',
//   })
//   try {
//     // Find all contents scheduled for **this exact date and time**
//     const contentsToPublish = await Content.find({
//       status: CONTENT_STATUS.SCHEDULED,
//       'scheduledAt.date': new Date(currentDateStr),
//       'scheduledAt.time': currentTimeStr,
//     })

//     for (const content of contentsToPublish) {
//       if (!content.user) continue // Skip if no user associated
//       try {
//         // You can call your publish function here
//         // await publishToPlatforms(content)

//         // Update status to published
//         content.status = CONTENT_STATUS.PUBLISHED
//         await content.save()

//         if (content.remindMe) {
//           const user = await User.findOne({
//             email: config?.super_admin?.email,
//           }).select('email')

//           // Send reminder notification to user
//           await sendNotification(
//             user?._id.toString() || '',
//             content?.user.toString(),
//             'Content Published',
//             `Your content "${content.caption}" has been published successfully.`,
//           )
//         }

//         logger.info(`Content ${content._id} auto-published ✅`)
//       } catch (err) {
//         content.status = CONTENT_STATUS.FAILED
//         await content.save()
//         logger.error(`Failed to auto-publish content ${content._id}:`, err)
//       }
//     }
//   } catch (err) {
//     logger.error('Error fetching scheduled contents:', err)
//   }
// })

cron.schedule('* * * * *', async () => {
  // await publisheReels()
})
