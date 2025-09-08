import { Model, Schema } from 'mongoose'

export interface IContentFilterables {
  searchTerm?: string
  title?: string
  description?: string
  contentType?: ContentType
  status?: ContentStatus
  date?: Date
}

export type ContentType = 'post' | 'reels' | 'story' | 'carousel'

interface ScheduledAtAny {
  type: 'any' // any time
}

interface ScheduledAtSingle {
  type: 'single' // specific date + time
  date: Date // "YYYY-MM-DD"
  time: string // "HH:mm"
}

interface ScheduledAtRange {
  type: 'range' // range
  date: Date // "YYYY-MM-DD"
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
  tags?: string[]
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
  stats?: {
    likes?: number
    comments?: number
    shares?: number
    views?: number
  }
  createdAt?: Date
  updatedAt?: Date
}

export type ContentModel = Model<IContent, {}, {}>
