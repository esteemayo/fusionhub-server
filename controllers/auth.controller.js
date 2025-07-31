/* eslint-disable */

import { StatusCodes } from 'http-status-codes';
import crypto from 'crypto';
import asyncHandler from 'express-async-handler';

import User from '../models/user.model.js';

import { BadRequestError } from './../errors/bad.request.error.js';
import { NotFoundError } from '../errors/not.found.error.js';
import { UnauthenticatedError } from '../errors/unauthenticated.error.js';
import { CustomAPIError } from '../errors/cutom.api.error.js';

import { createSendToken } from './../utils/create.send.token.util.js';
import { sendEmail } from './../utils/email.util.js';
import { createSendGoogleToken } from '../utils/create.send.google.token.util.js';

const devEnv = process.env.NODE_ENV !== 'production';

export const register = asyncHandler(async (req, res, next) => {
  const user = await User.create({ ...req.body });

  if (user) {
    return createSendToken(user, StatusCodes.CREATED, res);
  }
});

export const login = asyncHandler(async (req, res, next) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return next(
      new BadRequestError('Please provide username/email and password'),
    );
  }

  const user = await User.findOne({
    $or: [{ username: identifier }, { email: identifier }],
  }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(
      new BadRequestError(
        `That username/email and password combination didn't work. Try again.`,
      ),
    );
  }

  return createSendToken(user, StatusCodes.OK, res);
});

export const googleLogin = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    const newUser = await User.create({
      ...req.body,
      fromGoogle: true,
    });

    return createSendGoogleToken(newUser, StatusCodes.CREATED, req, res);
  }

  return createSendGoogleToken(user, StatusCodes.OK, res);
});

export const logout = (req, res, next) => {
  res
    .clearCookie('authToken', {
      sameSite: 'none',
      secure: true,
    })
    .status(StatusCodes.OK)
    .json('User has been logged out');
};

export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new BadRequestError('Please enter your email address'));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new NotFoundError('There is no user with the email address'));
  }

  const resetToken = user.changedPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const baseUrl = devEnv
    ? `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password`
    : `${process.env.PROD_URL}/reset-password`;

  const resetTokenUrl = `${baseUrl}/${resetToken}`;

  const logoUrl = devEnv
    ? `${process.env.DEV_URL}/svg/logo.svg`
    : `${process.env.PROD_URL}/svg/logo.svg`;

  const subject = devEnv
    ? 'Fusion Hub (Development) – Password Reset Instructions'
    : 'Fusion Hub – Password Reset Instructions';

  const message = `
    Hi ${user.name},

    We've received a request to change the password for your Fusion Hub account. If you requested this, click the link below to choose a new password. The link will expire in 10 minutes:

    Reset your password: ${resetTokenUrl}

    If you did not request this password reset, you may disregard this email. Your account will remain unchanged and secure.

    For other inquiries, please contact support at support@fusionhub.app.

    – The Fusion Hub Team
  `;

  const html = `
    <div style="background: #f4f8fb; color: #222; padding: 40px 30px; border-radius: 8px; font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="${logoUrl}" alt="Fusion Hub Logo" style="width: 200px;"/>
      </div>
      <h2 style="color: #2a4365;">Password Reset Request${devEnv ? ' (Development)' : ''}</h2>
      <p style="font-size: 16px;">Hello <strong>${user.name}</strong>,</p>
      <p style="font-size: 16px;">
        We've received a request to change the password for your Fusion Hub account. If you requested this, click the link below to choose a new password. The link will expire in <strong>10 minutes</strong>.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetTokenUrl}" style="background: #3182ce; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
          Reset Your Password
        </a>
      </div>
      <p style="font-size: 15px; color: #555;">
        If you did not request this password reset, you may disregard this email. Your account will remain unchanged and secure.
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
      <p style="font-size: 14px; color: #888;">
        For other inquiries, please contact support at <a href="mailto:support@fusionhub.app" style="color: #3182ce;">support@fusionhub.app</a>.
      </p>
      <p style="font-size: 14px; color: #888; margin-top: 24px;">
        – The Fusion Hub Team
      </p>
      ${devEnv
      ? `<p style="font-size: 13px; color: rgb(250, 66, 66); margin-top: 24px;">
            <strong>Note:</strong> This is a development environment email. In production, the reset link will be different.
          </p>`
      : ''
    }
    </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject,
      message,
      html,
    });

    return res.status(StatusCodes.OK).json({
      message:
        'A link to reset your password has been sent to the email address you provided. Please check your email and click on the link to set a new password. This link will expire in 10 minutes.',
      email: user.email,
      success: true,
    });
  } catch (err) {
    next(
      new CustomAPIError(
        'The password reset email could not be sent due to a server error. Please check the email address you provided and try again in a few minutes. If the issue continues, please contact support at support@fusionhub.app.',
      ),
    );
  }
});

export const resetPassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { password, passwordConfirm } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new BadRequestError('Token is invalid or has expired'));
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return createSendToken(user, StatusCodes.OK, res);
});

export const updatePassword = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.user;
  const { password, passwordConfirm, passwordCurrent } = req.body;

  const user = await User.findById(userId).select('+password');

  if (!(await user.comparePassword(passwordCurrent))) {
    return next(new UnauthenticatedError('Your current password is incorrect'));
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  return createSendToken(user, StatusCodes.OK, res);
});
