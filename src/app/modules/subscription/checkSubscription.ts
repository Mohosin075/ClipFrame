import { Subscription } from './subscription.model'
import { JwtPayload } from 'jsonwebtoken'
import { IPlan } from '../plan/plan.interface'
import { ContentType } from '../content/content.interface'
import { Plan } from '../plan/plan.model'
import { ISubscription } from './subscription.interface'
import { v4 as uuidv4 } from 'uuid'
import ApiError from '../../../errors/ApiError'
import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'

export const checkAndIncrementUsage = async (
  user: JwtPayload,
  type: ContentType,
  session: mongoose.ClientSession | null = null, // default to null
) => {
  const paid_subscription = await Subscription.findOne({
    user: user.authId,
    status: 'active',
  })
    .populate<{ plan: IPlan }>('plan')
    .session(session) // session can be null

  const plan = await Plan.findOne({ price: 0, status: 'active' }).session(
    session,
  )

  if (!plan) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'No Free Plan is currently available. Please consider upgrading to a Pro Plan to continue.',
    )
  }

  const now = new Date()
  const currentPeriodStart = now.toISOString()
  const currentPeriodEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
  ).toISOString()

  const subscriptionPayload: Partial<ISubscription> = {
    customerId: `cus_${uuidv4()}`,
    subscriptionId: `sub_${uuidv4()}`,
    price: 0,
    plan: plan?._id,
    user: user.authId,
    currentPeriodStart,
    currentPeriodEnd,
  }

  if (!paid_subscription || !paid_subscription.plan) {
    await Subscription.create([subscriptionPayload], { session })
  }

  const subscription = await Subscription.findOne({
    user: user.authId,
    status: 'active',
  })
    .populate<{ plan: IPlan }>('plan')
    .session(session)

  if (!subscription || !subscription.plan) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No Subscription found.')
  }

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

  if (used >= limit) {
    throw new Error(`Limit reached for ${type}. Please upgrade.`)
  }

  // Atomic increment using findByIdAndUpdate
  await Subscription.findByIdAndUpdate(
    subscription._id,
    { $inc: { [usageKey]: 1 } },
    { session },
  )

  return {
    subscriptionId: subscription._id,
    type,
    used: used + 1,
    limit,
  }
}
