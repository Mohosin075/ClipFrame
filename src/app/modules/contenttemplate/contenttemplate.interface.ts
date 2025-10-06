import { Model, Types } from 'mongoose';

export interface StepsItem {
  title: string;
  description?: string;
  mediaType: string;
  shotType: string;
  duration?: number;
}

export interface IContenttemplateFilterables {
  searchTerm?: string;
  title?: string;
  description?: string;
  category?: string;
  thumbnail?: string;
}

export interface IContenttemplate {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  type: string;
  category?: string;
  thumbnail?: string;
  steps: StepsItem[];
  hashtags: string[];
  isActive?: boolean;
  createdBy: Types.ObjectId;
}

export type ContenttemplateModel = Model<IContenttemplate, {}, {}>;
