import express from 'express';

import * as authMiddleware from '../middlewares/auth.middleware.js';
import * as contactController from '../controllers/contact.controller.js';

const router = express.Router();

router
  .route('/')
  .get(
    authMiddleware.protect,
    authMiddleware.restrictTo('admin'),
    contactController.getContacts,
  )
  .post(contactController.createContact);

router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin'));

router
  .route('/:id')
  .get(contactController.getContact)
  .patch(contactController.updateContact)
  .delete(contactController.deleteContact);

export default router;
