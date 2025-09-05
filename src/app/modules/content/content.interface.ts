import { Model, Schema } from 'mongoose'

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
  type?: string
  scheduledAt?: ScheduledAt
  remindMe?: boolean
  status?: string
  user?: Schema.Types.ObjectId
  socialAccounts?: {
    platform: string
    accountId: Schema.Types.ObjectId
  }[]
  createdAt?: Date
  updatedAt?: Date
}

export type ContentModel = Model<IContent, {}, {}>
