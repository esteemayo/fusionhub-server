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
  authMiddleware.restrictSoftBanned,
  commentController.getCommentsByUser,
);

router.patch(
  '/:id/like',
  authMiddleware.protect,
  authMiddleware.restrictSoftBanned,
  commentController.likeComment,
);

router.patch(
  '/:id/dislike',
  authMiddleware.protect,
  authMiddleware.restrictSoftBanned,
  commentController.dislikeComment,
);

router
  .route('/')
  .get(authMiddleware.optionalAuth, commentController.getComments)
  .post(
    authMiddleware.protect,
    authMiddleware.restrictSoftBanned,
    commentController.createComment,
  );

router
  .route('/:id')
  .get(commentController.getComment)
  .patch(
    authMiddleware.protect,
    authMiddleware.restrictSoftBanned,
    commentController.updateComment,
  )
  .delete(
    authMiddleware.protect,
    authMiddleware.restrictSoftBanned,
    commentController.deleteComment,
  );

export default router;
