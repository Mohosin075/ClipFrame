import { Model, Types } from 'mongoose';

export interface IStats {
  _id: Types.ObjectId;
  likes: number;
  comments: number;
}

export type StatsModel = Model<IStats, {}, {}>;
