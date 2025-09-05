import { Schema } from 'mongoose'
import { IContent } from './content.interface'

const contentSchema = new Schema<IContent>(
  {
    title: { type: String },
    description: { type: String },
    mediaUrls: { type: [String] },
    type: { type: String },
    scheduledAt: {
      type: {
        type: String,
        enum: ['any', 'single', 'range'],
        default: 'any',
      },
      Date: { type: String }, // for "single"
      Time: { type: String }, // for "single"
      startDate: { type: String }, // for "range"
      startTime: { type: String }, // for "range"
      endDate: { type: String }, // for "range"
      endTime: { type: String }, // for "range"
    },
    remindMe: { type: Boolean, default: false },
    status: { type: String },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    socialAccounts: [
      {
        platform: { type: String, required: true }, // e.g., "Facebook", "Instagram"
        accountId: {
          type: Schema.Types.ObjectId,
          ref: 'SocialIntegration',
          required: true,
        },
      },
    ],
  },
  { timestamps: true },
)
