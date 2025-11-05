/* eslint-disable */

import express from 'express';

import * as authMiddleware from '../middlewares/auth.middleware.js';
import * as userController from '../controllers/user.controller.js';
import * as blockController from '../controllers/block.controller.js';

const router = express.Router();

router.use(authMiddleware.protect);

router.get('/me', userController.getMe, userController.getUser);

router.get('/:username/details', userController.getUserByUsername);

router.get(
  '/stats',
  authMiddleware.restrictTo('admin'),
  userController.getUserStats,
);

router.get('/saved-posts', userController.getUserSavedPosts);

router.get('/:postId/saved-count', userController.savedPostsCount);

router.get('/blocked', authMiddleware.protect, blockController.getBlockedUsers);

router.post(
  '/:id/block',
  authMiddleware.protect,
  authMiddleware.restrictTo('admin'),
  blockController.toggleBlockUser,
);

router.patch('/update-me', userController.updateMe);

router.patch(
  '/:postId/save-post',
  authMiddleware.restrictTo('user'),
  userController.savePost,
);

router.delete('/delete-me', userController.deleteMe);

router.delete('/delete-avatar', userController.deleteAvatar);

router.delete('/delete-banner', userController.deleteBanner);

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
