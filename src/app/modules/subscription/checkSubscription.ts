import { Subscription } from './subscription.model'
import { JwtPayload } from 'jsonwebtoken'
import { IPlan } from '../plan/plan.interface'
import { ContentType } from '../content/content.interface'
import { Plan } from '../plan/plan.model'
import { ISubscription } from './subscription.interface'
import { v4 as uuidv4 } from 'uuid'
import ApiError from '../../../errors/ApiError'
import { StatusCodes } from 'http-status-codes'

export const checkAndIncrementUsage = async (
  user: JwtPayload,
  type: ContentType,
) => {
  // Find active subscription for this user and populate plan
  const paid_subscription = await Subscription.findOne({
    user: user.authId,
    status: 'active',
  }).populate<{ plan: IPlan }>('plan') // TS knows plan is populated

  const plan = await Plan.findOne({ price: 0 })

  const now = new Date()
  const currentPeriodStart = now.toISOString() // start is now
  const currentPeriodEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1, // next month
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
  ).toISOString()

  const subscriptionPayload: Partial<ISubscription> = {
    customerId: `cus_${uuidv4()}`, // unique customer id
    subscriptionId: `sub_${uuidv4()}`,
    price: 0,
    plan: plan?._id,
    user: user.authId,
    currentPeriodStart,
    currentPeriodEnd,
  }

  if (!paid_subscription || !paid_subscription.plan) {
    await Subscription.create(subscriptionPayload)
  }

  const subscription = await Subscription.findOne({
    user: user.authId,
    status: 'active',
  }).populate<{ plan: IPlan }>('plan')

  if (!subscription || !subscription.plan) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No Subscripton found.')
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
