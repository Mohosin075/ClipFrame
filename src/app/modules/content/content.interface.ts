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
  startDate: string // "YYYY-MM-DD"
  startTime: string // "HH:mm"
  endDate: string // "YYYY-MM-DD"
  endTime: string // "HH:mm"
}

type ScheduledAt = ScheduledAtAny | ScheduledAtSingle | ScheduledAtRange

export interface IContent {
  title?: string
  description?: string
  mediaUrls?: string[]
  contentType?: ContentType
  scheduledAt?: ScheduledAt
  remindMe?: boolean
  status?: string
  user?: Schema.Types.ObjectId
  socialAccounts?: {
    platform: string
    accountId: Schema.Types.ObjectId
  }[]
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
