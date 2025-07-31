import express from 'express';

import * as newsletterController from '../controllers/newsletter.controller.js';

const router = express.Router();

router.post('/subscribe', newsletterController.subscribe);

export default router;
