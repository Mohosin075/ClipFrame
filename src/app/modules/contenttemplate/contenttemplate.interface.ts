import { Model, Types } from 'mongoose'

export interface StepsItem {
  title: string
  mainTip: string
  detailedTips?: string
  mediaType: 'video' | 'image'
  url: string
  shotType: 'wide' | 'mid-shot' | 'close-up'
  duration?: string
}

export interface IContenttemplateFilterables {
  searchTerm?: string
  title?: string
  description?: string
  category?: string
  thumbnail?: string
}

export interface IContenttemplate {
  _id: Types.ObjectId
  title: string
  description?: string
  type: string
  category?: string
  thumbnail?: string
  previewUrl?: string
  steps?: StepsItem[]
  hashtags: string[]
  isActive?: boolean
  createdBy?: Types.ObjectId

  stats: {
    reuseCount: number
    loveCount: number
    lovedBy: Types.ObjectId[]
  }
}

export type ContenttemplateModel = Model<IContenttemplate, {}, {}>
