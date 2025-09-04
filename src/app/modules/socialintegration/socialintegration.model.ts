import { Schema, model } from 'mongoose';
import { ISocialintegration, SocialintegrationModel } from './socialintegration.interface';

const socialintegrationSchema = new Schema<ISocialintegration, SocialintegrationModel>({
  platform: { type: String },
  accountId: { type: String }, 
  accessToken: { type: String }, 
  refreshToken: { type: String },
  expiresAt: { type: Date },
}, {
  timestamps: true
});

export const Socialintegration = model<ISocialintegration, SocialintegrationModel>('Socialintegration', socialintegrationSchema);
