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
import { createNewSubscription } from '../../../stripe/handleSubscriptionCreated'

export const handleFreeSubscriptionCreate = async (user: JwtPayload) => {
  const plan = await Plan.findOne({ price: 0, status: 'active' })
  if (!plan) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Free Plan not found!')
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

  const payload = {
    price: 0,
    user: user.authId,
    plan: plan && plan._id,
    status: 'active',
    currentPeriodStart,
    currentPeriodEnd,
  }

  const subscription = await Subscription.findOne({
    user: user.authId,
    status: 'active',
  })

  if (!subscription) {
    await createNewSubscription(payload)
  }

  return subscription
}

export const checkAndIncrementUsage = async (
  user: JwtPayload,
  type: ContentType,
  session: mongoose.ClientSession | null = null, // default to null
) => {
  await handleFreeSubscriptionCreate(user)
  const subscription = await Subscription.findOne({
    user: user.authId,
    status: 'active',
  }).populate<{ plan: IPlan }>('plan')

  if (!subscription) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Subscription not found!')
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
