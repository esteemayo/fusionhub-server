/* eslint-disable */

import express from 'express';

import * as authMiddleware from '../middlewares/auth.middleware.js';
import * as userController from '../controllers/user.controller.js';

const router = express.Router();

router.use(authMiddleware.protect);

router.get('/me', userController.getMe, userController.getUser);

router.get(
  '/stats',
  authMiddleware.restrictTo('admin'),
  userController.getUserStats,
);

router.get(
  '/saved-posts',
  authMiddleware.protect,
  userController.getUserSavedPosts,
);

router.patch('/update-me', userController.updateMe);

router.patch(
  '/save-post/:postId',
  authMiddleware.protect,
  authMiddleware.restrictTo('user'),
  userController.savePost,
);

router.delete('/delete-me', userController.deleteMe);

router.delete('/delete-avatar', userController.deleteAvatar);

router
  .route('/')
  .get(authMiddleware.restrictTo('admin'), userController.getUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(authMiddleware.restrictTo('admin'), userController.updateUser)
  .delete(authMiddleware.restrictTo('admin'), userController.deleteUser);

export default router;
