import { Schema, model } from 'mongoose';
import { IOnboardingscreen, OnboardingscreenModel } from './onboardingscreen.interface'; 

const onboardingscreenSchema = new Schema<IOnboardingscreen, OnboardingscreenModel>({
  title: { type: String },
  description: { type: String },
  imageURL: { type: String },
  order: { type: Number },
  actionText: { type: String },
  skipEnabled: { type: Boolean },
  status: { type: String, enum: ['active', 'inactive', 'deleted'], default: 'active' },
}, {
  timestamps: true
});

export const Onboardingscreen = model<IOnboardingscreen, OnboardingscreenModel>('Onboardingscreen', onboardingscreenSchema);
