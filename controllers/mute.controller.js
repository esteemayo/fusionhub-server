import { StatusCodes } from 'http-status-codes';
import asyncHandler from 'express-async-handler';

import User from '../models/user.model.js';

import { NotFoundError } from '../errors/not.found.error.js';
import { BadRequestError } from '../errors/bad.request.error.js';

export const getMutedEntities = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.user;

  const user = await User.findById(userId)
    .select('mutedUsers mutedComments mutedReplies')
    .populate('mutedUsers.targetId', 'username email')
    .populate('mutedComments.targetId', 'content author createdAt')
    .populate('mutedReplies.targetId', 'content author createdAt');

  if (!user) {
    return next(
      new NotFoundError(`There is no user found with the given ID → ${userId}`),
    );
  }

  const mutedUsers = (user.mutedUsers ?? [])
    .filter((item) => item.targetId)
    .map((item) => ({
      id: item.targetId._id,
      targetType: item.targetType,
      username: item.targetId.username,
      email: item.targetId.email,
      reason: item.reason,
      mutedAt: item.mutedAt,
    }));

  const mutedComments = (user.mutedComments ?? [])
    .filter((item) => item.targetId)
    .map((item) => ({
      id: item.targetId._id,
      targetType: item.targetType,
      content: item.targetId.content,
      author: item.targetId.author,
      reason: item.reason,
      mutedAt: item.mutedAt,
    }));

  const mutedReplies = (user.mutedRepliess ?? [])
    .filter((item) => item.targetId)
    .map((item) => ({
      id: item.targetId._id,
      targetType: item.targetType,
      content: item.targetId.content,
      author: item.targetId.author,
      reason: item.reason,
      mutedAt: item.mutedAt,
    }));

  return res.status(StatusCodes.OK).json({
    mutedUsers,
    mutedComments,
    mutedReplies,
  });
});

export const muteTarget = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.user;
  const { targetType, targetId, reason } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return next(
      new NotFoundError(`There is no user found with the given ID → ${userId}`),
    );
  }

  const muteFieldMap = {
    user: 'mutedUsers',
    comment: 'mutedComments',
    reply: 'mutedReplies',
  };

  const muteField = muteFieldMap[targetType];

  if (!muteField) {
    return next(new BadRequestError('Invalid target type mapping'));
  }

  const alreadyMuted =
    user[muteField].some((item) => item.targetId.toString() === targetId) ||
    false;

  if (alreadyMuted) {
    user[muteField] = user[muteField].filter(
      (item) => item.targetId.toString() !== targetId,
    );

    await user.save({ validateBeforeSave: false });

    return res.status(StatusCodes.OK).json({
      message: `${targetType} unmuted successfully`,
      muted: user[muteField],
    });
  }

  user[muteField].push({
    targetId,
    targetType,
    reason,
    mutedAt: new Date(),
  });

  await user.save({ validateBeforeSave: false });

  return res.status(StatusCodes.OK).json({
    message: `${targetType} muted successfully`,
    muted: user[muteField],
    mutedAt: new Date(),
  });
});
