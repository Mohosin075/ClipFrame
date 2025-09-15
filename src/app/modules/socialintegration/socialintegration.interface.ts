import { Model, Types } from 'mongoose';

export interface ISocialintegrationFilterables {
  searchTerm?: string;
  accountId?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface ISocialintegration {
  _id: Types.ObjectId;
  user : Types.ObjectId
  platform: string;
  appId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export type SocialintegrationModel = Model<ISocialintegration, {}, {}>;
