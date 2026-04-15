import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import config from '../../../config'
import { stripeService } from './stripe.service'
import { webhookService } from './webhook.service'
import ApiError from '../../../errors/ApiError'
import catchAsync from '../../../shared/catchAsync'

const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string
  const webhookSecret = config.stripe.webhookSecret as string

  if (!signature || !webhookSecret) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Stripe signature or webhook secret missing',
    )
  }

  let event

  try {
    event = stripeService.constructWebhookEvent(req.body, signature)
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    throw new ApiError(StatusCodes.BAD_REQUEST, `Webhook Error: ${err.message}`)
  }

  // Process the event
  await webhookService.processWebhookEvent(event)

  res.status(StatusCodes.OK).json({ received: true })
})

export const WebhookController = {
  handleStripeWebhook,
}
