/* eslint-disable */

import { StatusCodes } from 'http-status-codes';
import asyncHandler from 'express-async-handler';

import Subscriber from '../models/subscriber.model.js';

import { CustomAPIError } from '../errors/cutom.api.error.js';
import { NotFoundError } from '../errors/not.found.error.js';
import { BadRequestError } from '../errors/bad.request.error.js';

import { sendEmail } from '../utils/email.util.js';
import * as mc from '../config/mailchimp.config.js';

const devEnv = process.env.NODE_ENV !== 'production';

export const subscribe = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new BadRequestError('Please provide an email address'));
  }

  const existingSubscriber = await Subscriber.findOne({ email });

  if (existingSubscriber && existingSubscriber.status === 'confirmed') {
    return res.status(StatusCodes.CONFLICT).json('Email already subscribed');
  }

  let confirmToken;

  if (existingSubscriber) {
    existingSubscriber.status = 'pending';
    confirmToken = existingSubscriber.generateConfirmationToken();
    await existingSubscriber.save();
  } else {
    const subscriber = new Subscriber({ email, status: 'pending' });
    confirmToken = subscriber.generateConfirmationToken();
    await subscriber.save();
  }

  const baseUrl = devEnv
    ? `${req.protocol}://${req.get('host')}/api/v1/newsletter/subscribe/confirm`
    : `${process.env.CLIENT_PROD_URL}/subscribe/confirm`;

  const confirmationUrl = `${baseUrl}?token=${confirmToken}&email=${encodeURIComponent(email)}`;

  const text = `Please confirm your subscription by clicking the link: ${confirmationUrl}`;

  const html = `
    <div>
      <p>Please confirm your subscription by clicking the link below</p>
      <a href=${confirmationUrl}>Confirm Subscription</a>
    </div>
  `;

  try {
    await sendEmail({
      subject: 'Confirm your subscription',
      text,
      html,
    });

    return res.status(StatusCodes.OK).json({
      message: 'Confirmation email sent.',
    });
  } catch (err) {
    next(
      new CustomAPIError(
        'The subscription confirm email could not be sent due to a server error. Please check the email address you provided and try again in a few minutes. If the issue continues, please contact support at support@fusionhub.app.',
      ),
    );
  }
});

export const confirmSubscription = asyncHandler(async (req, res, next) => {
  const { email, token } = req.query;

  if (!email || !token) {
    return next(new BadRequestError('Invalid confirmation link'));
  }

  const subscriber = await Subscriber.findOne({
    email,
    status: 'pending',
    confirmationToken: token,
    confirmationTokenExpires: { $gt: Date.now() },
  });

  if (!subscriber) {
    return next(new BadRequestError('Invalid or expired token'));
  }

  subscribe.status = 'confirmed';
  subscriber.confirmationToken = undefined;
  subscriber.confirmationTokenExpires = undefined;
  await subscriber.save();

  const mcResponse = await mc.addToMailchimp(email);

  console.log('MailChimp Response: ', mcResponse);

  if (mcResponse.alreadySubscribed) {
    return next(new BadRequestError('Email already subscribed to Mailchimp'));
  }

  return res.status(StatusCodes.CREATED).json({
    message: 'Your subscription is confirmed, Thank you!',
  });
});

export const unsubscribe = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new BadRequestError('Please provide an email address'));
  }

  const subscriber = await Subscriber.findOne({ email });

  if (!subscriber || subscriber.status !== 'confirmed') {
    return next(new NotFoundError('Subscriber not found or not confirmed'));
  }

  const token = subscriber.generateUnsubscribeToken();
  await subscriber.save();

  const baseUrl = devEnv
    ? `${req.protocol}://${req.get('host')}/api/v1/newsletter/unsubscribe/confirm`
    : `${process.env.CLIENT_PROD_URL}/unsubscribe/confirm`;

  const confirmationLink = `${baseUrl}?token=${token}&email=${encodeURIComponent(email)}`;

  const text = `Click the link below to confirm your unsubscription: ${confirmationLink}`;

  const html = `
    <div>
      <p>You requested to unsubscribe from our newsletter.</p>
      <p>Click the link below to confirm your unsubscription:</p>
      <a href=${confirmationLink}>Confirm Unsubscription</a>
      <p>If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  try {
    await sendEmail({
      to: email,
      subject: 'Confirm your unsubscription',
      text,
      html,
    });

    return res.status(StatusCodes.OK).json({
      message: 'Unsubscribe confirmation email sent. Please check your inbox.',
    });
  } catch (error) {
    next(
      new CustomAPIError(
        'The unsubscribe confirmation email could not be sent due to a server error. Please try again later.',
      ),
    );
  }
});

export const confirmUnsubscribe = asyncHandler(async (req, res, next) => {
  const { email, token } = req.query;

  if (!email || !token) {
    return next(new BadRequestError('Invalid unsubscribe link'));
  }

  const subscriber = await Subscriber.findOne({
    email,
    status: 'confirmed',
    unsubscribeToken: token,
    unsubscribeTokenExpires: { $gt: Date.now() },
  });

  if (!subscriber) {
    return next(new BadRequestError('Invalid or expired token'));
  }

  const mcResponse = await mc.removeFromMailchimp(email);

  if (!mcResponse) {
    return next(new CustomAPIError('Error unsubscribing from Mailchimp'));
  }

  subscriber.status = 'unsubscribed';
  subscriber.unsubscribetoken = undefined;
  subscriber.unsubscribeTokenExpires = undefined;
  await subscriber.save();

  return res.status(StatusCodes.OK).json({
    message: 'You have successfully unsubscribed from our newsletter',
  });
});
