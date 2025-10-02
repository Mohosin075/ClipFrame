import { Model, Schema, Types } from 'mongoose'

export interface IContentFilterables {
  searchTerm?: string
  title?: string
  description?: string
  contentType?: ContentType
  status?: ContentStatus
  date?: Date
}

export type ContentType = 'post' | 'reels' | 'story' | 'carousel'

enum ScheduledAtType {
  ANY = 'any',
  SINGLE = 'single',
  RANGE = 'range',
}

interface ScheduledAt {
  type: ScheduledAtType

  // optional fields depending on type
  date?: Date // "YYYY-MM-DD"
  time?: string // "HH:mm"
  startTime?: string // "HH:mm"
  endTime?: string // "HH:mm"
}

export type ContentStatus =
  | 'draft'
  | 'scheduled'
  | 'published'
  | 'failed'
  | 'deleted'

export interface IClips {
  step: number
  url: string
  duration: number
  type: 'image' | 'video'
  size?: number
}

export interface IContent {
  _id?: Types.ObjectId
  contentId?: string
  caption?: string
  // description?: string
  mediaUrls?: string[]
  contentType?: ContentType
  scheduledAt?: ScheduledAt
  remindMe?: boolean
  status?: ContentStatus
  user?: Schema.Types.ObjectId
  platform: string[]
  clips?: IClips[]
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
  instagramContainerId: string
  platformStatus?: Map<string, 'pending' | 'published' | 'failed'>
  createdAt?: Date
  updatedAt?: Date
}

export type ContentModel = Model<IContent, {}, {}>

export interface VideoStats {
  id: string
  description?: string
  permalink: string
  createdAt: string
  updatedAt: string
  durationSec?: number
  videoUrl?: string
  likesCount: number
  commentsCount: number
  insights: Record<string, number>
}
