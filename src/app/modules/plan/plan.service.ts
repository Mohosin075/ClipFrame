import { StatusCodes } from 'http-status-codes'
import { IPlan } from './plan.interface'
import { Plan } from './plan.model'
import mongoose from 'mongoose'
import stripe from '../../../config/stripe'
import { createStripeProductCatalog } from '../../../stripe/createStripeProductCatalog'
import ApiError from '../../../errors/ApiError'
import { updateStripeProductCatalog } from '../../../stripe/updateStripeProductCatalog'

const createPlanToDB = async (payload: IPlan): Promise<IPlan | null> => {
  const productPayload = {
    title: payload.title,
    description: payload.description,
    duration: payload.duration,
    price: Number(payload.price),
  }

  const product = await createStripeProductCatalog(productPayload)

  if (!product) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to create subscription product',
    )
  }

  if (product) {
    payload.paymentLink = product.paymentLink
    payload.productId = product.productId
    payload.priceId = product.priceId
  }

  const result = await Plan.create(payload)
  if (!result) {
    await stripe.products.del(product.productId)
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to created Package')
  }

  return result
}

export const updatePlanToDB = async (
  id: string,
  payload: Partial<IPlan>, // partial to allow updating only some fields
): Promise<IPlan> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Plan ID')
  }

  // Step 1: Fetch the current plan
  const existingPlan = await Plan.findById(id)
  if (!existingPlan) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Plan not found')
  }

  // Step 2: Update Stripe product if price or duration changed
  let stripeUpdate: { priceId?: string; paymentLink?: string } = {}
  if (!existingPlan.productId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Stripe productId is missing')
  }
  if (payload.price || payload.duration) {
    stripeUpdate = await updateStripeProductCatalog(
      existingPlan.productId as string,
      {
        ...existingPlan.toObject(),
        ...payload, // merge updates
      },
    )
  }

  // Step 3: Merge payload + Stripe update
  const updatedData = {
    ...payload,
    ...stripeUpdate,
    updatedAt: new Date(),
  }

  // Step 4: Update DB and return updated document
  const result = await Plan.findByIdAndUpdate(id, updatedData, { new: true })
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to update plan')
  }

  return result
}

const getPlanFromDB = async (paymentType: string): Promise<IPlan[]> => {
  const query: any = {
    status: 'Active',
  }
  if (paymentType) {
    query.paymentType = paymentType
  }

  const result = await Plan.find(query)
  return result
}

const getPlanDetailsFromDB = async (id: string): Promise<IPlan | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid ID')
  }
  const result = await Plan.findById(id)
  return result
}

const deletePlanToDB = async (id: string): Promise<IPlan | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid ID')
  }

  const result = await Plan.findByIdAndUpdate(
    { _id: id },
    { status: 'Delete' },
    { new: true },
  )

  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to deleted Package')
  }

  return result
}

export const PackageService = {
  createPlanToDB,
  updatePlanToDB,
  getPlanFromDB,
  getPlanDetailsFromDB,
  deletePlanToDB,
}
