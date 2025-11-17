/* eslint-disable */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'A category must have a name'],
      unique: true,
      lowerCase: true,
      trim: true,
    },
  },
  { timestamps: true },
);

const Category =
  mongoose.models.Category || mongoose.model('Category', categorySchema);

export default Category;
