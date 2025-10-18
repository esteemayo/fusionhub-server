/* eslint-disable */

import Category from '../models/category.model.js';
import * as factory from '../controllers/handler.factory.controller.js';

export const getCategories = factory.getAll(Category);
export const getCategory = factory.getOneById(Category, 'category');
export const createCategory = factory.createOne(Category);
export const updateCategory = factory.updateOne(Category, 'category');
export const deleteCategory = factory.deleteOne(Category, 'category');
