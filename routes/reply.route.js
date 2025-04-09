/* eslint-disable */

import express from 'express';

import * as authMiddleware from '../middlewares/auth.middleware.js';
import * as replyCommentController from '../controllers/reply.controller.js';

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(replyCommentController.getReplies)
  .post(
    authMiddleware.protect,
    authMiddleware.restrictTo('user'),
    replyCommentController.createReply,
  );

router
  .route('/:id')
  .get(replyCommentController.getReply)
  .patch(authMiddleware.protect, replyCommentController.updateReply)
  .delete(authMiddleware.protect, replyCommentController.deleteReply);

export default router;
