/* eslint-disable */

import { StatusCodes } from 'http-status-codes';
import asyncHandler from 'express-async-handler';

import Category from '../models/category.model.js';

import { APIFeatures } from '../utils/api.features.js';
import * as factory from '../controllers/handler.factory.controller.js';

export const getCategories = asyncHandler(async (req, res, next) => {
  const features = new APIFeatures(Category, req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const categories = await features.query;

  return res.status(StatusCodes.OK).json(categories);
});

export const getCategory = factory.getOneById(Category, 'category');
export const createCategory = factory.createOne(Category);
export const updateCategory = factory.updateOne(Category, 'category');
export const deleteCategory = factory.deleteOne(Category, 'category');
