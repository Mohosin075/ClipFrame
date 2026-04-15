import { Types } from 'mongoose'
import { Subscription } from './subscription.model'
import { ISubscriptionPlan } from './subscription.interface'
import ApiError from '../../../errors/ApiError'
import { StatusCodes } from 'http-status-codes'
import { ContentType } from '../content/content.interface'
import { Socialintegration } from '../socialintegration/socialintegration.model'

interface UsageData {
  userId: string
  storageUsed: number
  apiCallsThisMonth: number
  reelsUsed: number
  postsUsed: number
  storiesUsed: number
  businessesUsed: number
  carouselUsed: number
}

class UsageTrackingService {
  // Check if user can manage more businesses
  async canManageBusiness(
    userId: string,
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const { subscriptionService } = await import('./subscription.service')
      await subscriptionService.handleFreeSubscriptionCreate(userId)

      const subscription = await Subscription.findOne({
        userId: new Types.ObjectId(userId),
        status: { $in: ['active', 'trialing'] },
      }).populate('planId')

      if (!subscription) {
        return { allowed: false, reason: 'No active subscription' }
      }

      let plan: ISubscriptionPlan
      if (
        subscription.planId &&
        typeof subscription.planId === 'object' &&
        'businessesManageable' in (subscription.planId as any)
      ) {
        plan = subscription.planId as unknown as ISubscriptionPlan
      } else {
        plan = await subscriptionService.getPlanById(
          subscription.planId.toString(),
        )
      }

      const businessUsed = await Socialintegration.countDocuments({
        user: new Types.ObjectId(userId),
      })
      const businessLimit = plan.businessesManageable ?? 0

      if (businessUsed >= businessLimit) {
        return {
          allowed: false,
          reason: `You have reached the maximum businesses you can manage (${businessLimit}). Please upgrade your plan to manage more.`,
        }
      }

      return { allowed: true }
    } catch (error) {
      console.error('Error checking business management limit:', error)
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to check business limit',
      )
    }
  }

  // Reset weekly usage if 7 days have passed
  async resetWeeklyUsageIfNeeded(subscription: any) {
    const now = new Date()
    const lastReset = subscription.lastReset
      ? new Date(subscription.lastReset)
      : now
    const diffInMs = now.getTime() - lastReset.getTime()
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24)

    if (diffInDays >= 7) {
      subscription.usage = {
        reelsUsed: 0,
        postsUsed: 0,
        storiesUsed: 0,
        businessesUsed: subscription.usage?.businessesUsed ?? 0, // Businesses manageable usually doesn't reset weekly
        carouselUsed: 0,
      }
      subscription.lastReset = now
      await subscription.save()
    }
  }

  // Check and increment usage for a specific content type
  async checkAndIncrementUsage(userId: string, type: ContentType) {
    try {
      const { subscriptionService } = await import('./subscription.service')
      await subscriptionService.handleFreeSubscriptionCreate(userId)

      const subscription = await Subscription.findOne({
        userId: new Types.ObjectId(userId),
        status: { $in: ['active', 'trialing'] },
      }).populate('planId')

      if (!subscription) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'No active subscription found!',
        )
      }

      // Reset weekly usage if 1 week passed
      await this.resetWeeklyUsageIfNeeded(subscription)

      let plan: ISubscriptionPlan
      if (
        subscription.planId &&
        typeof subscription.planId === 'object' &&
        'reelsPerWeek' in (subscription.planId as any)
      ) {
        plan = subscription.planId as unknown as ISubscriptionPlan
      } else {
        plan = await subscriptionService.getPlanById(
          subscription.planId.toString(),
        )
      }

      const usageMap: Record<ContentType, keyof typeof subscription.usage> = {
        reel: 'reelsUsed',
        post: 'postsUsed',
        story: 'storiesUsed',
        carousel: 'carouselUsed',
      }
      const limitMap: Record<ContentType, keyof ISubscriptionPlan> = {
        reel: 'reelsPerWeek',
        post: 'postsPerWeek',
        story: 'storiesPerWeek',
        carousel: 'carouselPerWeek',
      }

      const usageKey = usageMap[type]
      const limitKey = limitMap[type]

      const used = subscription.usage[usageKey]
      const limit = plan[limitKey] as number

      if (used >= limit) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          `Weekly limit reached for ${type}. Your current plan allows ${limit} ${type}s per week.`,
        )
      }

      const usageKeyField = `usage.${usageKey}`

      const updatedSubscription = await Subscription.findByIdAndUpdate(
        subscription._id,
        { $inc: { [usageKeyField]: 1 } },
        { new: true },
      ).orFail()

      return {
        subscriptionId: updatedSubscription._id,
        type,
        used: updatedSubscription.usage[usageKey],
        limit,
      }
    } catch (error) {
      if (error instanceof ApiError) throw error
      console.error('Error checking and incrementing usage:', error)
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to update usage',
      )
    }
  }

  // Get current usage for a user
  async getCurrentUsage(userId: string): Promise<UsageData> {
    try {
      const subscription = await Subscription.findOne({
        userId: new Types.ObjectId(userId),
        status: { $in: ['active', 'trialing'] },
      })

      const businessesUsed = await Socialintegration.countDocuments({
        user: new Types.ObjectId(userId),
      })

      return {
        userId,
        storageUsed: 0,
        apiCallsThisMonth: 0,
        reelsUsed: subscription?.usage?.reelsUsed ?? 0,
        postsUsed: subscription?.usage?.postsUsed ?? 0,
        storiesUsed: subscription?.usage?.storiesUsed ?? 0,
        businessesUsed: businessesUsed,
        carouselUsed: subscription?.usage?.carouselUsed ?? 0,
      }
    } catch (error) {
      console.error('Error getting current usage:', error)
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to get usage data',
      )
    }
  }

  // Get usage with plan limits
  async getUsageWithLimits(userId: string): Promise<{
    usage: UsageData
    limits: {
      reelsPerWeek: number
      postsPerWeek: number
      storiesPerWeek: number
      businessesManageable: number
      carouselPerWeek: number
    }
    percentages: {
      reelsUsed: number
      postsUsed: number
      storiesUsed: number
      businessesUsed: number
      carouselUsed: number
    }
  }> {
    try {
      const subscription = await Subscription.findOne({
        userId: new Types.ObjectId(userId),
        status: { $in: ['active', 'trialing'] },
      }).populate('planId')

      if (!subscription) {
        throw new ApiError(
          StatusCodes.NOT_FOUND,
          'No active subscription found',
        )
      }

      let plan: ISubscriptionPlan
      if (
        subscription.planId &&
        typeof subscription.planId === 'object' &&
        'name' in (subscription.planId as any)
      ) {
        plan = subscription.planId as unknown as ISubscriptionPlan
      } else {
        const { subscriptionService } = await import('./subscription.service')
        plan = await subscriptionService.getPlanById(
          subscription.planId.toString(),
        )
      }

      const usage = await this.getCurrentUsage(userId)

      return {
        usage,
        limits: {
          reelsPerWeek: plan.reelsPerWeek,
          postsPerWeek: plan.postsPerWeek,
          storiesPerWeek: plan.storiesPerWeek,
          businessesManageable: plan.businessesManageable,
          carouselPerWeek: plan.carouselPerWeek,
        },
        percentages: {
          reelsUsed:
            Math.round((usage.reelsUsed / plan.reelsPerWeek) * 100) || 0,
          postsUsed:
            Math.round((usage.postsUsed / plan.postsPerWeek) * 100) || 0,
          storiesUsed:
            Math.round((usage.storiesUsed / plan.storiesPerWeek) * 100) || 0,
          businessesUsed:
            Math.round(
              (usage.businessesUsed / plan.businessesManageable) * 100,
            ) || 0,
          carouselUsed:
            Math.round((usage.carouselUsed / plan.carouselPerWeek) * 100) || 0,
        },
      }
    } catch (error) {
      if (error instanceof ApiError) throw error
      console.error('Error getting usage with limits:', error)
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Failed to get usage data',
      )
    }
  }

  // Check if user is approaching limits (80% threshold)
  async checkApproachingLimits(userId: string): Promise<{
    warnings: string[]
    suggestions: string[]
  }> {
    try {
      const data = await this.getUsageWithLimits(userId)
      const warnings: string[] = []
      const suggestions: string[] = []

      return { warnings, suggestions }
    } catch (error) {
      console.error('Error checking approaching limits:', error)
      return { warnings: [], suggestions: [] }
    }
  }

  // Private helper methods
  private async getCurrentServiceCount(userId: string): Promise<number> {
    try {
      // This can be used to track any user-created content that is limited by plan
      // For now returning 0, can be connected to any content model (e.g., Posts, Recipes)
      return 0
    } catch (error) {
      console.error('Error getting content count:', error)
      return 0
    }
  }

  private async getCurrentTeamMemberCount(userId: string): Promise<number> {
    try {
      // For now, we assume a professional always has themselves as a member
      // Expand this if a formal Team/Member collection is added later
      return 1
    } catch (error) {
      console.error('Error getting team member count:', error)
      return 1
    }
  }

  // Track feature usage (for analytics)
  async trackFeatureUsage(userId: string, feature: string): Promise<void> {
    try {
      console.log(`Feature used: ${feature} by user: ${userId}`)
    } catch (error) {
      console.error('Error tracking feature usage:', error)
    }
  }
}

export const usageTrackingService = new UsageTrackingService()
