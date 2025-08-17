import express from 'express';

import * as uploadController from '../controllers/upload.controller.js';

const router = express.Router();

router.get('/auth', uploadController.uploadAuth);

export default router;
