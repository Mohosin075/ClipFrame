import { Subscription } from './subscription.model'
import { JwtPayload } from 'jsonwebtoken'
import { IPlan } from '../plan/plan.interface'
import { ContentType } from '../content/content.interface'

export const checkAndIncrementUsage = async (
  user: JwtPayload,
  type: ContentType,
) => {
  // Find active subscription for this user and populate plan
  const subscription = await Subscription.findOne({
    user: user.authId,
    status: 'active',
  }).populate<{ plan: IPlan }>('plan') // TS knows plan is populated

  if (!subscription || !subscription.plan) {
    throw new Error('No active subscription')
  }

  // Map type to usage + limit fields
  const usageMap: Record<ContentType, keyof typeof subscription.usage> = {
    reels: 'reelsUsed',
    post: 'postsUsed',
    story: 'storiesUsed',
    carousel: 'carouselUsed',
  }

  const limitMap: Record<ContentType, keyof IPlan['limits']> = {
    reels: 'reelsPerWeek',
    post: 'postsPerWeek',
    story: 'storiesPerWeek',
    carousel: 'carouselPerWeek',
  }

  const usageKey = usageMap[type]
  const limitKey = limitMap[type]

  const used = subscription.usage[usageKey]
  const limit = subscription.plan.limits[limitKey]
  console.log({ used })

  if (used >= limit) {
    throw new Error(`Limit reached for ${type}. Please upgrade.`)
  }

  // Increment usage
  subscription.usage[usageKey] += 1
  await subscription.save()

  return {
    subscriptionId: subscription._id,
    type,
    used: subscription.usage[usageKey],
    limit,
  }
}
