/* eslint-disable */

import express from 'express';

import * as authMiddleware from '../middlewares/auth.middleware.js';
import * as adminDashboardController from '../controllers/admin.dashboard.controller.js';

const router = express.Router();

router.get(
  '/',
  authMiddleware.protect,
  authMiddleware.restrictTo('admin'),
  adminDashboardController.getReportStats,
);

export default router;
