import { Schema, Types, model } from 'mongoose'
import {
  ISocialintegration,
  SocialintegrationModel,
} from './socialintegration.interface'

const socialintegrationSchema = new Schema<
  ISocialintegration,
  SocialintegrationModel
>(
  {
    user: { type: Schema.Types.ObjectId },
    platform: { type: String },
    appId: { type: String },
    accessToken: { type: String },
    refreshToken: { type: String },
    expiresAt: { type: Date },
  },
  {
    timestamps: true,
  },
)

export const Socialintegration = model<
  ISocialintegration,
  SocialintegrationModel
>('Socialintegration', socialintegrationSchema)
