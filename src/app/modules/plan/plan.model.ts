import { model, Schema } from 'mongoose'
import { IPlan, PlanModel } from './plan.interface'

const planSchema = new Schema<IPlan, PlanModel>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    priceId: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    duration: {
      type: String,
      enum: ['1 month', '3 months', '6 months', '1 year'],
      required: true,
    },
    paymentType: {
      type: String,
      enum: ['Monthly', 'Yearly'],
      required: true,
    },
    productId: {
      type: String,
      required: true,
    },
    paymentLink: {
      type: String,
      required: true,
    },
    limits: {
      reelsPerWeek: { type: Number, default: 0 },
      postsPerWeek: { type: Number, default: 0 },
      storiesPerWeek: { type: Number, default: 0 },
      businessesManageable: { type: Number, default: 1 },
      carouselPerWeek: { type: Number, default: 1 },
    },
    status: {
      type: String,
      enum: ['Active', 'Delete'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  },
)

export const Plan = model<IPlan, PlanModel>('Plan', planSchema)
