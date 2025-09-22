/* eslint-disable */

import express from 'express';

import * as authMiddleware from '../middlewares/auth.middleware.js';
import * as replyController from '../controllers/reply.controller.js';

const router = express.Router({ mergeParams: true });

router.get('/:commentId/comment', replyController.getRepliesByComment);

router.get(
  '/:userId/user',
  authMiddleware.protect,
  replyController.getRepliesByUser,
);

router.patch('/:id/like', authMiddleware.protect, replyController.likeReply);

router.patch(
  '/:id/dislike',
  authMiddleware.protect,
  replyController.dislikeReply,
);

router
  .route('/')
  .get(replyController.getReplies)
  .post(authMiddleware.protect, replyController.createReply);

router
  .route('/:id')
  .get(replyController.getReply)
  .patch(authMiddleware.protect, replyController.updateReply)
  .delete(authMiddleware.protect, replyController.deleteReply);

export default router;
