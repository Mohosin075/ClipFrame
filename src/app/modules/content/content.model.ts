import { Schema, model } from 'mongoose';
import { IContent, ContentModel } from './content.interface';

const contentSchema = new Schema<IContent, ContentModel>({
  title: { type: String }, 
  description: { type: String },
  mediaUrls: { type: [String] },
  type: { type: String },
  scheduledAt: { type: Date },
  status: { type: String },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  socialAccounts: { type: [Schema.Types.ObjectId], ref: 'SocialAccount' },
  createdAt: { type: Date },
  updatedAt: { type: Date },
}, {
  timestamps: true
});

export const Content = model<IContent, ContentModel>('Content', contentSchema);
