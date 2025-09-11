import { Schema, model } from 'mongoose';
import { IStats, StatsModel } from './stats.interface'; 

const statsSchema = new Schema<IStats, StatsModel>({
  likes: { type: Number },
  comments: { type: Number },
}, {
  timestamps: true
});

export const Stats = model<IStats, StatsModel>('Stats', statsSchema);
