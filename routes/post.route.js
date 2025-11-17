/* eslint-disable */

import express from 'express';

import commentRoute from './comment.route.js';

import * as postController from '../controllers/post.controller.js';

import * as authMiddleware from '../middlewares/auth.middleware.js';
import { increaseViews } from '../middlewares/increase.views.middleware.js';

const router = express.Router();

router.use('/:postId/comments', commentRoute);

router.get('/my-posts', authMiddleware.protect, postController.getMyPosts);

router.get('/random-posts', postController.getRandomPosts);

router.get('/recent-posts', postController.getRecentPosts);

router.get('/top-posts', postController.getTopPost);

router.get('/most-read', postController.getMostReadPosts);

router.get('/trends', postController.getTrendingPosts);

router.get('/featured-posts', postController.getFeaturedPosts);

router.get(
  '/comments/:id',
  authMiddleware.protect,
  postController.getCommentsOnPost,
);

router.get('/related-posts', postController.getRelatedPosts);

router.get('/:id/saved-count', postController.savedPostsCount);

router.get(
  '/:userId/user',
  authMiddleware.protect,
  authMiddleware.restrictSoftBanned,
  postController.getPostsByUser,
);

router.get(
  '/user/:userId/liked-posts',
  authMiddleware.protect,
  authMiddleware.restrictSoftBanned,
  postController.getPostsLikedByUser,
);

router.get(
  '/user/:userId/disliked-posts',
  authMiddleware.protect,
  authMiddleware.restrictSoftBanned,
  postController.getPostsDislikedByUser,
);

router.get(
  '/liked-posts',
  authMiddleware.protect,
  authMiddleware.restrictSoftBanned,
  postController.getMyLikedPosts,
);

router.get(
  '/disliked-posts',
  authMiddleware.protect,
  authMiddleware.restrictSoftBanned,
  postController.getMyDislikedPosts,
);

router.get('/comments/:id/users', postController.getPostCommentAuthors);

router.get('/count-by-category', postController.getPostCountsByCategory);

router.get('/category/:category', postController.getPostsForCategory);

router.get('/tags', postController.getTags);

router.get('/tags/:tag', postController.getPostsByTag);

router.get('/search', postController.searchPosts);

router.get('/:slug/details', increaseViews, postController.getPostBySlug);

router.patch(
  '/:id/feature-post',
  authMiddleware.protect,
  authMiddleware.restrictTo('admin'),
  postController.featurePost,
);

router.patch('/:id/views', postController.updateViews);

router.patch(
  '/:id/like',
  authMiddleware.protect,
  authMiddleware.restrictSoftBanned,
  postController.likePost,
);

router.patch(
  '/:id/dislike',
  authMiddleware.protect,
  authMiddleware.restrictSoftBanned,
  postController.dislikePost,
);

router
  .route('/')
  .get(authMiddleware.optionalAuth, postController.getPosts)
  .post(
    authMiddleware.protect,
    authMiddleware.restrictSoftBanned,
    postController.createPost,
  );

router
  .route('/:id')
  .get(increaseViews, postController.getPostById)
  .patch(
    authMiddleware.protect,
    authMiddleware.restrictSoftBanned,
    postController.updatePost,
  )
  .delete(
    authMiddleware.protect,
    authMiddleware.restrictSoftBanned,
    postController.deletePost,
  );

export default router;
