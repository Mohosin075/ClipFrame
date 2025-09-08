import cron from 'node-cron'
import { Content } from '../app/modules/content/content.model'
import { CONTENT_STATUS } from '../app/modules/content/content.constants'
import { logger } from '../shared/logger'
import { sendNotification } from '../helpers/notificationHelper'
import config from '../config'
import { User } from '../app/modules/user/user.model'

// Run every minute
cron.schedule('* * * * *', async () => {
  console.log('Scheduler running... ⏰')
  const now = new Date()

  // Local date (YYYY-MM-DD)
  const currentDateStr = now.toLocaleDateString('en-CA') // outputs "2025-09-08"

  // Local time (HH:mm)
  const currentTimeStr = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
  try {
    // Find all contents scheduled for **this exact date and time**
    const contentsToPublish = await Content.find({
      status: CONTENT_STATUS.SCHEDULED,
      'scheduledAt.date': new Date(currentDateStr),
      'scheduledAt.time': currentTimeStr,
    })

    for (const content of contentsToPublish) {
      if(!content.user) continue; // Skip if no user associated
      try {
        // You can call your publish function here
        // await publishToPlatforms(content)

        // Update status to published
        content.status = CONTENT_STATUS.PUBLISHED
        await content.save()

        if (content.remindMe) {
          const user = await User.findOne({
            email: config?.super_admin?.email,
          }).select('email')

          // Send reminder notification to user
          await sendNotification(
            user?._id.toString() || '',
            content?.user.toString(),
            'Content Published',
            `Your content "${content.title}" has been published successfully.`,
          )
        }

        logger.info(`Content ${content._id} auto-published ✅`)
      } catch (err) {
        content.status = CONTENT_STATUS.FAILED
        await content.save()
        logger.error(`Failed to auto-publish content ${content._id}:`, err)
      }
    }
  } catch (err) {
    logger.error('Error fetching scheduled contents:', err)
  }
})
