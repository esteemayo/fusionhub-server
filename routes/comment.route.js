/* eslint-disable */

import express from 'express';

import replyCommentRoute from './reply.route.js';

import * as authMiddleware from '../middlewares/auth.middleware.js';
import * as commentController from '../controllers/comment.controller.js';

const router = express.Router({ mergeParams: true });

router.use('/:commentId/replies', replyCommentRoute);

router.get(
  '/:userId/user',
  authMiddleware.protect,
  commentController.getCommentsByUser,
);

router.patch(
  '/:id/like',
  authMiddleware.protect,
  commentController.likeComment,
);

router.patch(
  '/:id/dislike',
  authMiddleware.protect,
  commentController.dislikeComment,
);

router
  .route('/')
  .get(authMiddleware.optionalAuth, commentController.getComments)
  .post(authMiddleware.protect, commentController.createComment);

router
  .route('/:id')
  .get(commentController.getComment)
  .patch(authMiddleware.protect, commentController.updateComment)
  .delete(authMiddleware.protect, commentController.deleteComment);

export default router;
