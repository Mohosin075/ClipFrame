import { Schema, model } from 'mongoose'
import { IStats } from './stats.interface'

const StatsSchema = new Schema<IStats>({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  contentId: { type: Schema.Types.ObjectId, ref: 'Content' },
  platform: {
    type: String,
    enum: ['facebook', 'instagram', 'youtube', 'tiktok'],
    required: true,
  },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
})

export const Stats = model<IStats>('Stats', StatsSchema)
