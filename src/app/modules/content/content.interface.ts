import { Model, Schema } from 'mongoose'

export type ContentType = 'post' | 'reels' | 'story' | 'carousel'

interface ScheduledAtAny {
  type: 'any' // any time
}

interface ScheduledAtSingle {
  type: 'single' // specific date + time
  Date: string // "YYYY-MM-DD"
  Time: string // "HH:mm"
}

interface ScheduledAtRange {
  type: 'range' // range
  Date: string // "YYYY-MM-DD"
  startTime: string // "HH:mm"
  endTime: string // "HH:mm"
}

type ScheduledAt = ScheduledAtAny | ScheduledAtSingle | ScheduledAtRange

export type ContentStatus =
  | 'draft'
  | 'scheduled'
  | 'published'
  | 'failed'
  | 'deleted'

export interface IContent {
  title?: string
  description?: string
  mediaUrls?: string[]
  contentType?: ContentType
  scheduledAt?: ScheduledAt
  remindMe?: boolean
  status?: ContentStatus
  user?: Schema.Types.ObjectId
  platform: string[]
  reelsInfo?: {
    duration?: number // seconds
    resolution?: string
  }
  storyInfo?: {
    expiryTime?: Date
  }
  carouselInfo?: {
    slidesCount?: number
  }
  createdAt?: Date
  updatedAt?: Date
}

export type ContentModel = Model<IContent, {}, {}>
