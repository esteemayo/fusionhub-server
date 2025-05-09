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

router.get('/top-posts', postController.getTopPost);

router.get('/trends', postController.getTrendingPosts);

router.get('/featured-posts', postController.getFeaturedPosts);

router.get('/related-posts', postController.getRelatedPosts);

router.get(
  '/liked-posts',
  authMiddleware.protect,
  postController.getUserLikedPosts,
);

router.get(
  '/disliked-posts',
  authMiddleware.protect,
  postController.getUserDisikedPosts,
);

router.get('/comments/:id/users', postController.getPostComentUsers);

router.get('/count-by-category', postController.getCountByCategory);

router.get('/category/:category', postController.getPostsByCategory);

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

router.patch('/:id/like', authMiddleware.protect, postController.likePost);

router.patch(
  '/:id/dislike',
  authMiddleware.protect,
  postController.dislikePost,
);

router
  .route('/')
  .get(postController.getPosts)
  .post(authMiddleware.protect, postController.createPost);

router
  .route('/:id')
  .get(increaseViews, postController.getPostById)
  .patch(authMiddleware.protect, postController.updatePost)
  .delete(authMiddleware.protect, postController.deletePost);

export default router;
