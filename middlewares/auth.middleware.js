/* eslint-disable */

import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';

import User from '../models/user.model.js';

import { ForbiddenError } from './../errors/forbidden.error.js';
import { UnauthenticatedError } from './../errors/unauthenticated.error.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ').pop();
  } else if (req.cookies.authToken) {
    token = req.cookies.authToken;
  }

  if (!token) {
    return next(
      new UnauthenticatedError(
        'You are not logged in! Please log in to get access',
      ),
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new UnauthenticatedError(
        'The user belonging to this token does no longer exist',
      ),
    );
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new UnauthenticatedError(
        'User recently changed password! Please log in again',
      ),
    );
  }

  if (currentUser.isSoftBanned) {
    if (currentUser.softBanExpires && currentUser.softBanExpires < Date.now()) {
      currentUser.isSoftBanned = false;
      currentUser.softBanExpires = null;

      await currentUser.save({ timestamps: false });
    }
  }

  req.user = currentUser;
  next();
});

export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ').pop();
  } else if (req.cookies.authToken) {
    token = req.cookies.authToken;
  }

  if (token) {
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id);

    if (currentUser && !currentUser.changedPasswordAfter(decoded.iat)) {
      req.user = currentUser;
    } else if (currentUser.isSoftBanned) {
      if (
        currentUser.softBanExpires &&
        currentUser.softBanExpires < Date.now()
      ) {
        currentUser.isSoftBanned = false;
        currentUser.softBanExpires = null;

        await currentUser.save({ timestamps: false });
        req.user = currentUser;
      }
    } else {
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
});

export const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          'You do not have permission to perform this operation',
        ),
      );
    }

    next();
  };

export const verifyUser = (req, res, next) => {
  if (req.params.id !== req.user.id || req.user.role !== 'admin') {
    return next(
      new ForbiddenError('You are not allowed to perform this action'),
    );
  }

  next();
};

export const checkBlock = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.user;
  const { targetId } = req.body;

  const user = await User.findById(userId).select('blockedUsers');

  const blocked =
    (user &&
      user.blockedUsers.some(
        (entry) => entry.targetId.toString() === targetId,
      )) ||
    false;

  if (blocked) {
    return next(
      new ForbiddenError('You have blocked this user. Interaction denied'),
    );
  }

  next();
});

export const restrictSoftBanned = (req, res, next) => {
  const { isSoftBanned } = req.user;

  if (isSoftBanned) {
    return next(
      new ForbiddenError(
        'Your account is temporarily restricted due to a policy violation',
      ),
    );
  }

  next();
};
