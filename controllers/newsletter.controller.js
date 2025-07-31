import { StatusCodes } from 'http-status-codes';
import asyncHandler from 'express-async-handler';

import Subscriber from '../models/subscriber.model.js';

import { addToMailchimp } from '../config/mailchimp.config.js';
import { BadRequestError } from '../errors/bad.request.error.js';

export const subscribe = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new BadRequestError('Please provide an email address'));
  }

  const existingSubscriber = await Subscriber.findOne({ email });

  if (existingSubscriber && existingSubscriber.confirmed) {
    return res.status(StatusCodes.CONFLICT).json('Email already subscribed');
  }

  const subscriber = existingSubscriber || new Subscriber({ email });

  await subscriber.save();

  const mcResponse = await addToMailchimp(email);

  if (mcResponse.alreadySubscribed) {
    return next(new BadRequestError('Email already subscribed to Mailchimp'));
  }

  return res.status(StatusCodes.CREATED).json({
    status: 'success',
    message: 'Subscription successful. Please check your email to confirm.',
    data: {
      subscriber: {
        email: subscriber.email,
      },
    },
  });
});
