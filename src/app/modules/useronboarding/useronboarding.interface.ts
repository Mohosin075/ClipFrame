import { Model, Types } from 'mongoose'

export interface IUseronboardingFilterables {
  searchTerm?: string
  businessType?: string
  customBusinessType?: string
  businessDescription?: string
}

export enum SocialPlatform {
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  TIKTOK = 'tiktok',
  TWITTER = 'twitter',
  LIKEE = 'likee',
}

export enum ContentLanguage {
  EN = 'en',
  BN = 'bn',
  ES = 'es',
}

export interface SocialHandlesItem {
  platform: SocialPlatform
  username: string
}

export enum TargetAudience {
  LOCAL = 'local',
  TOURIST = 'tourist',
  ONLINE = 'online',
  ALL = 'all',
}

export interface IBrandColor {
  name: string
  value: string
}

export interface IUseronboarding {
  _id: Types.ObjectId
  userId: Types.ObjectId
  businessType: string
  customBusinessType?: string
  businessDescription?: string
  targetAudience: TargetAudience[]
  preferredLanguages?: ContentLanguage[]
  autoTranslateCaptions: boolean
  socialHandles: SocialHandlesItem[]
  logo: string
  brandColors: IBrandColor[]
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export type UseronboardingModel = Model<IUseronboarding, {}, {}>
