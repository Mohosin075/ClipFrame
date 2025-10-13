import { model, Schema } from 'mongoose'
import { ContentModel, IContent } from './content.interface'
import { CONTENT_STATUS } from './content.constants'

const contentSchema = new Schema<IContent>(
  {
    contentId: { type: String },
    templateId: { type: Schema.Types.ObjectId, ref: 'ContentTemplate' },
    caption: { type: String },
    // description: { type: String },
    mediaUrls: { type: [String] },
    contentType: { type: String, enum: ['post', 'reels', 'story', 'carousel'] },
    scheduledAt: {
      type: {
        type: String,
        enum: ['any', 'single', 'range'],
        default: 'any',
      },
      date: { type: Date }, // for "single"
      time: { type: String }, // for "single"
      startTime: { type: String }, // for "range"
      endTime: { type: String }, // for "range"
    },
    remindMe: { type: Boolean, default: false },
    status: {
      type: String,
      enum: Object.values(CONTENT_STATUS),
      default: CONTENT_STATUS.DRAFT,
    },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    platform: {
      type: [String],
      enum: ['facebook', 'instagram', 'tiktok'],
      default: [],
    },
    tags: { type: [String], default: [] },
    reelsInfo: {
      duration: { type: Number }, // seconds
      resolution: { type: String },
    },
    clips: [
      {
        step: { type: Number },
        url: { type: String },
        duration: { type: Number },
        type: { type: String, enum: ['image', 'video'] },
      },
    ],
    storyInfo: {
      expiryTime: { type: Date },
    },
    carouselInfo: {
      slidesCount: { type: Number },
    },
    stats: {
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      views: { type: Number, default: 0 },
    },
    instagramContainerId: { type: String },
    facebookContainerId: { type: String },
    platformStatus: { type: Map, of: String, default: {} },
  },

  { timestamps: true },
)
contentSchema.index({ contentType: 1, 'scheduledAt.date': 1, status: 1 })

export const Content = model<IContent, ContentModel>('Content', contentSchema)
