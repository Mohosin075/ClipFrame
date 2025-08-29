import { Model, Types } from 'mongoose'

export interface ICategoryFilterables {
  searchTerm?: string
  name?: string
  description?: string
}

export interface ICategory {
  _id: Types.ObjectId
  name: string
  description?: string
  image?: string
}

export type CategoryModel = Model<ICategory, {}, {}>
