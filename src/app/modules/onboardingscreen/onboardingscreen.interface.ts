import { Model, Types } from 'mongoose';

export interface IOnboardingscreenFilterables {
  searchTerm?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  actionText?: string;
}

export interface IOnboardingscreen {
  _id: Types.ObjectId;
  title: string;
  description: string;
  imageURL: string;
  order: number;
  actionText?: string;
  skipEnabled?: boolean;
  status?: 'active' | 'inactive' | 'deleted';
}

export type OnboardingscreenModel = Model<IOnboardingscreen, {}, {}>;
