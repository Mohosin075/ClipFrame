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
      startTime: { type: String }, // for "range"
      endTime: { type: String }, // for "range"
    },
    remindMe: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published', 'failed', 'deleted'],
      default: 'scheduled',
    },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    platform: { type: [String], enum: ['facebook', 'instagram', 'tiktok'], default: [] },
  },

  { timestamps: true },
)

export const Content = model<IContent, ContentModel>('Content', contentSchema)
