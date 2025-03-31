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

router.patch('/update-me', userController.updateMe);

router.patch('/delete-avatar', userController.deleteAvatar);

router.delete('/delete-me', userController.deleteMe);

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
