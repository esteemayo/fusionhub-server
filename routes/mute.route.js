/* eslint disable */

import express from 'express';

import * as authMiddleware from '../middlewares/auth.middleware.js';
import * as muteController from '../controllers/mute.controller.js';

const router = express.Router();

router.use(authMiddleware.protect);

router
  .route('/')
  .get(muteController.getMutedEntities)
  .post(authMiddleware.restrictTo('admin'), muteController.muteTarget);

router.post(
  '/unmute',
  authMiddleware.restrictTo('admin'),
  muteController.unmuteTarget,
);

export default router;
