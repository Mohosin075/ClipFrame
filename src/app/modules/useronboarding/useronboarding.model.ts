import { model, Schema } from 'mongoose'
import {
  ContentLanguage,
  IBrandColor,
  IUseronboarding,
  SocialHandlesItem,
  SocialPlatform,
  TargetAudience,
} from './useronboarding.interface'

const SocialHandlesSchema = new Schema<SocialHandlesItem>({
  platform: {
    type: String,
    enum: Object.values(SocialPlatform),
  },
  username: { type: String },
})

const BrandColorSchema = new Schema<IBrandColor>({
  name: { type: String, required: true },
  value: { type: String, required: true },
})

const UserOnboardingSchema = new Schema<IUseronboarding>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  businessType: { type: String, default: 'General' },
  customBusinessType: { type: String, default: '' },
  businessDescription: { type: String, default: '' },
  targetAudience: {
    type: [String],
    enum: Object.values(TargetAudience),
    default: [],
  },
  contentLanguages: {
    type: String,
    enum: Object.values(ContentLanguage),
    default: ContentLanguage.EN,
  },
  logo: { type: String, default: '' },
  brandColors: { type: [BrandColorSchema], default: [] },
  autoTranslateCaptions: { type: Boolean, default: false },
  socialHandles: { type: [SocialHandlesSchema], default: [] },
  deletedAt: { type: Date, default: null },
})

export const Useronboarding = model<IUseronboarding>(
  'Useronboarding',
  UserOnboardingSchema,
)
