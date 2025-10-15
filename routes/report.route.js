/* eslint-disable */

import express from 'express';

import * as authMiddleware from '../middlewares/auth.middleware.js';
import * as reportController from '../controllers/report.controller.js';

const router = express.Router();

router.use(authMiddleware.protect);

router.get(
  '/admin',
  authMiddleware.restrictTo('admin'),
  reportController.getAdminReports,
);

router.get('/:id', reportController.getReport);

router.post('/', reportController.createReport);

router.patch(
  '/admin/:id/review',
  authMiddleware.restrictTo('admin'),
  reportController.updateReport,
);

router.delete(
  '/admin/:id',
  authMiddleware.restrictTo('admin'),
  reportController.deleteReport,
);

export default router;
