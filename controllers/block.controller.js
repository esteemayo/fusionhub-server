/* eslint disable */

import { StatusCodes } from 'http-status-codes';
import asyncHandler from 'express-async-handler';

import User from '../models/user.model.js';
import { cleanUpBlockedRelationship } from '../utils/clean.up.blocked.relationship.util.js';

import { ForbiddenError } from '../errors/forbidden.error.js';
import { NotFoundError } from '../errors/not.found.error.js';
import { BadRequestError } from '../errors/bad.request.error.js';

export const getBlockedUsers = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.user;

  const user = await User.findById(userId)
    .select('blockedUsers')
    .populate('blockedUsers.targetId', 'username email name image');

  const blockedUsers = (user.blockedUsers ?? []).map((entry) => ({
    id: entry.targetId._id,
    username: entry.targetId.username,
    email: entry.targetId.email,
    name: entry.targetId.name,
    image: entry.targetId.image,
    reason: entry.reason,
    blockedAt: entry.blockedAt,
  }));

  return res.status(StatusCodes.OK).json(blockedUsers);
});

export const toggleBlockUser = asyncHandler(async (req, res, next) => {
  const { id: targetId } = req.params;
  const { id: userId, role } = req.user;

  if (!req.body.targetId) req.body.targetId = targetId;

  if (userId === targetId) {
    return next(new BadRequestError('You cannot block yourself'));
  }

  const user = await User.findById(userId);
  const targetUser = await User.findById(targetId).select('_id role');

  if (!user) {
    return next(
      new NotFoundError(`There is no user found with the given ID → ${userId}`),
    );
  }

  if (!targetUser) {
    return next(new NotFoundError('Target user does not exist'));
  }

  if (targetUser.role === 'admin') {
    return next(new ForbiddenError('You cannot block an admin account'));
  }

  const isAlreadyBlocked =
    user.blockedUsers?.some(
      (entry) => entry.targetId.toString() === targetId,
    ) || false;

  if (isAlreadyBlocked) {
    user.blockedUsers = user.blockedUsers.filter(
      (entry) => entry.targetId.toString() !== targetId,
    );

    await user.save({ validateBeforeSave: false });

    return res.status(StatusCodes.OK).json({
      message: 'User unblocked successfully',
    });
  }

  user.blockedUsers.push({
    ...req.body,
  });

  await user.save({ validateBeforeSave: false });
  await cleanUpBlockedRelationship(user._id, targetUser._id);

  return res.status(StatusCodes.OK).json({
    message: 'User blocked successfully',
  });
});
