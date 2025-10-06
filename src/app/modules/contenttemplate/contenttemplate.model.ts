import { Schema, model, Types } from 'mongoose'
import { IContenttemplate } from './contenttemplate.interface'

// Step schema based on StepsItem interface
const stepSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  mediaType: { type: String, enum: ['video', 'image'], required: true },
  url: { type: String, required: true },
  shotType: {
    type: String,
    enum: ['wide', 'mid-shot', 'close-up'],
    required: true,
  },
  duration: { type: Number, default: 5 },
})

// Main ContentTemplate schema
const contentTemplateSchema = new Schema<IContenttemplate>(
  {
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['reel', 'post', 'story'], default: 'reel' },
    category: { type: String },
    thumbnail: { type: String },
    steps: { type: [stepSchema], default: [] },
    hashtags: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Types.ObjectId, ref: 'User'},
  },
  { timestamps: true },
)

// Export typed model
export const ContentTemplate = model<IContenttemplate>(
  'ContentTemplate',
  contentTemplateSchema,
)
