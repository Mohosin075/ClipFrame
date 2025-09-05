import { model, Schema } from 'mongoose'
import { ContentModel, IContent } from './content.interface'

const contentSchema = new Schema<IContent>(
  {
    title: { type: String },
    description: { type: String },
    mediaUrls: { type: [String] },
    contentType: { type: String, enum: ['post', 'reels', 'story', 'carousel'] },
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
          ref: 'Content',
          required: true,
        },
      },
    ],

  },

  { timestamps: true },
)

export const Content = model<IContent, ContentModel>('Content', contentSchema)
