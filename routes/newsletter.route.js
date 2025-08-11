/* eslint-disable */

import express from 'express';

import * as newsletterController from '../controllers/newsletter.controller.js';

const router = express.Router();

router.get('/subscribe/confirm', newsletterController.confirmSubscription);

router.get('/unsubscribe/confirm', newsletterController.confirmUnsubscribe);

router.post('/subscribe/init', newsletterController.subscribe);

router.post('/unsubscribe/init', newsletterController.unsubscribe);

export default router;
