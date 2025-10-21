import { Types } from 'mongoose'

export interface IStats {
  user?: Types.ObjectId
  contentId: Types.ObjectId
  platform: 'facebook' | 'instagram' | 'youtube' | 'tiktok'
  likes: number
  comments: number
  shares: number
  views: number
}
