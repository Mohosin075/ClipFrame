import { Model, Types } from 'mongoose';

export interface IContentFilterables {
  searchTerm?: string;
  title?: string;
  description?: string;
}

export interface IContent {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  mediaUrls: string[];
  type: string;
  scheduledAt?: Date;
  status: string;
  user: Types.ObjectId;
  socialAccounts?: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type ContentModel = Model<IContent, {}, {}>;
