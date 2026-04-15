import { SubscriptionPlan } from './subscription-plan.model'
import { stripeService } from './stripe.service'

// Default subscription plans for ClipFrame
const defaultPlans = [
  {
    name: 'Free Plan',
    description: 'Perfect for creators starting out',
    price: 0,
    currency: 'usd',
    interval: 'month' as const,
    intervalCount: 1,
    trialPeriodDays: 0,
    features: [
      'Access to 50+ basic frames',
      'Standard video export quality',
      'Basic video editing tools',
      'ClipFrame watermark on videos',
      'Community support access',
    ],
    maxTeamMembers: 1,
    maxServices: 5,
    reelsPerWeek: 5,
    postsPerWeek: 5,
    storiesPerWeek: 5,
    businessesManageable: 1,
    carouselPerWeek: 5,
    userTypes: ['user'],
    priority: 1,
    tier: 'free',
  },
  {
    name: 'Monthly Plan',
    description: 'Advanced tools for growing creators',
    price: 14.99,
    currency: 'usd',
    interval: 'month' as const,
    intervalCount: 1,
    trialPeriodDays: 10,
    features: [
      'Access to 500+ premium frames',
      'HD video export quality',
      'Advanced filters and overlays',
      'Remove ClipFrame watermark',
      'Priority video rendering',
      'Standard social media integrations',
    ],
    maxTeamMembers: 1,
    maxServices: 20,
    reelsPerWeek: 20,
    postsPerWeek: 20,
    storiesPerWeek: 20,
    businessesManageable: 5,
    carouselPerWeek: 20,
    userTypes: ['user'],
    priority: 2,
    tier: 'basic',
  },
  {
    name: 'Yearly Plan',
    description: 'Professional suite for full-scale production',
    price: 99.99,
    currency: 'usd',
    interval: 'year' as const,
    intervalCount: 1,
    trialPeriodDays: 10,
    features: [
      'Everything in Monthly',
      '4K ultra-HD export quality',
      'Custom frame uploads',
      'Multi-team collaboration',
      'Early access to new frame drops',
      'Dedicated account manager',
    ],
    maxTeamMembers: 1,
    maxServices: 999,
    reelsPerWeek: 999,
    postsPerWeek: 999,
    storiesPerWeek: 999,
    businessesManageable: 100,
    carouselPerWeek: 999,
    userTypes: ['user'],
    priority: 3,
    tier: 'premium',
  },
]

export async function seedSubscriptionPlans(): Promise<void> {
  try {
    console.log('Starting subscription plans seeding...')

    // Check if plans already exist
    const existingPlansCount = await SubscriptionPlan.countDocuments()
    if (existingPlansCount > 0) {
      console.log(
        `${existingPlansCount} subscription plans already exist. Skipping seed.`,
      )
      return
    }

    // Create plans in Stripe and database
    for (const planData of defaultPlans) {
      try {
        // Create Stripe product
        const stripeProduct = await stripeService.createProduct({
          name: planData.name,
          description: planData.description,
          metadata: {
            userTypes: planData.userTypes.join(','),
            maxTeamMembers: planData.maxTeamMembers.toString(),
            maxServices: planData.maxServices.toString(),
            reelsPerWeek: planData.reelsPerWeek.toString(),
            postsPerWeek: planData.postsPerWeek.toString(),
            storiesPerWeek: planData.storiesPerWeek.toString(),
            businessesManageable: planData.businessesManageable.toString(),
            carouselPerWeek: planData.carouselPerWeek.toString(),
          },
        })

        // Create Stripe price
        const stripePrice = await stripeService.createPrice({
          productId: stripeProduct.id,
          unitAmount: Math.round(planData.price * 100), // Convert to cents
          currency: planData.currency,
          interval: planData.interval,
          intervalCount: planData.intervalCount,
          metadata: {
            planName: planData.name,
          },
        })

        // Create local plan
        const plan = new SubscriptionPlan({
          ...planData,
          stripeProductId: stripeProduct.id,
          stripePriceId: stripePrice.id,
          isActive: true,
        })

        await plan.save()
        console.log(`Created subscription plan: ${planData.name}`)
      } catch (error) {
        console.error(`Error creating plan ${planData.name}:`, error)
        // Continue with other plans even if one fails
      }
    }

    console.log('Subscription plans seeding completed successfully')
  } catch (error) {
    console.error('Error seeding subscription plans:', error)
    throw error
  }
}

// Function to update existing plans (for migrations)
export async function updateSubscriptionPlans(): Promise<void> {
  try {
    console.log('Updating subscription plans...')

    // Add any plan updates here
    // Example: Update features for existing plans

    console.log('Subscription plans update completed')
  } catch (error) {
    console.error('Error updating subscription plans:', error)
    throw error
  }
}

// Function to create a specific plan (for testing or manual creation)
export async function createSpecificPlan(planData: any): Promise<void> {
  try {
    // Create Stripe product
    const stripeProduct = await stripeService.createProduct({
      name: planData.name,
      description: planData.description,
      metadata: planData.metadata || {},
    })

    // Create Stripe price
    const stripePrice = await stripeService.createPrice({
      productId: stripeProduct.id,
      unitAmount: Math.round(planData.price * 100),
      currency: planData.currency,
      interval: planData.interval,
      intervalCount: planData.intervalCount || 1,
    })

    // Create local plan
    const plan = new SubscriptionPlan({
      ...planData,
      stripeProductId: stripeProduct.id,
      stripePriceId: stripePrice.id,
    })

    await plan.save()
    console.log(`Created specific plan: ${planData.name}`)
  } catch (error) {
    console.error(`Error creating specific plan:`, error)
    throw error
  }
}
