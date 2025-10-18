/* eslint-disable */

import express from 'express';

import * as authMiddleware from '../middlewares/auth.middleware.js';
import * as categoryController from '../controllers/category.controller.js';

const router = express.Router();

router
  .route('/')
  .get(authMiddleware.optionalAuth, categoryController.getCategories)
  .post(
    authMiddleware.protect,
    authMiddleware.restrictTo('admin'),
    categoryController.createCategory,
  );

router
  .route('/:id')
  .get(categoryController.getCategory)
  .patch(
    authMiddleware.protect,
    authMiddleware.restrictTo('admin'),
    categoryController.updateCategory,
  )
  .delete(
    authMiddleware.protect,
    authMiddleware.restrictTo('admin'),
    categoryController.deleteCategory,
  );

export default router;
