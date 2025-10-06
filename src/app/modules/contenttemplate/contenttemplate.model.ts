import { Schema, model } from 'mongoose'
import {
  IContenttemplate,
  ContenttemplateModel,
} from './contenttemplate.interface'

const stepsItemSchema = new Schema(
  {
    title: { type: String },
    description: { type: String },
    mediaType: { type: String },
    shotType: { type: String },
    duration: { type: Number },
  },
  { _id: false },
)

const contenttemplateSchema = new Schema<
  IContenttemplate,
  ContenttemplateModel
>(
  {
    title: { type: String },
    description: { type: String },
    type: { type: String },
    category: { type: String },
    thumbnail: { type: String },
    steps: [stepsItemSchema],
    hashtags: { type: [String] },
    isActive: { type: Boolean },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  },
)

export const Contenttemplate = model<IContenttemplate, ContenttemplateModel>(
  'Contenttemplate',
  contenttemplateSchema,
)
