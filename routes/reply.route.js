/* eslint-disable */

import express from 'express';

import * as authMiddleware from '../middlewares/auth.middleware.js';
import * as replyController from '../controllers/reply.controller.js';

const router = express.Router({ mergeParams: true });

router.get(
  '/:commentId/comment',
  authMiddleware.optionalAuth,
  replyController.getRepliesByComment,
);

router.get(
  '/:userId/user',
  authMiddleware.protect,
  authMiddleware.restrictSoftBanned,
  replyController.getRepliesByUser,
);

router.patch(
  '/:id/like',
  authMiddleware.protect,
  authMiddleware.restrictSoftBanned,
  replyController.likeReply,
);

router.patch(
  '/:id/dislike',
  authMiddleware.protect,
  authMiddleware.restrictSoftBanned,
  replyController.dislikeReply,
);

router
  .route('/')
  .get(replyController.getReplies)
  .post(
    authMiddleware.protect,
    authMiddleware.restrictSoftBanned,
    replyController.createReply,
  );

router
  .route('/:id')
  .get(replyController.getReply)
  .patch(
    authMiddleware.protect,
    authMiddleware.restrictSoftBanned,
    replyController.updateReply,
  )
  .delete(
    authMiddleware.protect,
    authMiddleware.restrictSoftBanned,
    replyController.deleteReply,
  );

export default router;
