import { Request, Response } from 'express'
import catchAsync from '../../../shared/catchAsync'
import { SubscriptionService } from './subscription.service'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import { JwtPayload } from 'jsonwebtoken'
import { Plan } from '../plan/plan.model'
import ApiError from '../../../errors/ApiError'
import stripe from '../../../config/stripe'
import config from '../../../config'

// export const createCheckoutSession = async (req: Request, res: Response) => {
//   const { planId } = req.body
//   const user = req.user as JwtPayload

//   const plan = await Plan.findById(planId)
//   if (!plan) throw new ApiError(404, 'Plan not found!')

//   // You should store Stripe Price ID in plan
//   const session = await stripe.checkout.sessions.create({
//     payment_method_types: ['card'],
//     mode: 'subscription',
//     customer_email: user.email, // optional if you have user email
//     line_items: [
//       {
//         price: plan.priceId, // this comes from Stripe Price ID
//         quantity: 1,
//       },
//     ],
//     success_url: `${config.clientUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
//     cancel_url: `${config.clientUrl}/subscription/cancel`,
//   })

//   res.status(200).json({ url: session.url })
// }

const subscriptions = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.subscriptionsFromDB(req.query)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Subscription List Retrieved Successfully',
    data: result,
  })
})

const subscriptionDetails = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.subscriptionDetailsFromDB(
    req.user as JwtPayload,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Subscription Details Retrieved Successfully',
    data: result,
  })
})

export const SubscriptionController = {
  subscriptions,
  subscriptionDetails,
}
