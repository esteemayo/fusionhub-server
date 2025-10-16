import { StatusCodes } from 'http-status-codes';
import asyncHandler from 'express-async-handler';

import User from '../models/user.model.js';

import { NotFoundError } from '../errors/not.found.error.js';
import { BadRequestError } from '../errors/bad.request.error.js';

export const getMutedEntities = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.user;

  const user = await User.findById(userId)
    .populate('mutedUsers', 'username')
    .populate('mutedComments', 'content')
    .populate('mutedReplies', 'content');

  if (!user) {
    return next(
      new NotFoundError(`There is no user found with the given ID → ${userId}`),
    );
  }

  return res.status(StatusCodes.OK).json({
    mutedUsers: user.mutedUsers,
    mutedComments: user.mutedComments,
    mutedReplies: user.mutedReplies,
  });
});

export const muteEntity = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.user;
  const { targetType, targetId, action } = req.body;

  if (!['user', 'comment', 'reply'].includes(targetType)) {
    return next(new BadRequestError('Invalid target type'));
  }

  if (!['mute', 'unmute'].includes(action)) {
    return next(new BadRequestError('Invalid action type'));
  }

  const user = await User.findById(userId);

  if (!user) {
    return next(
      new NotFoundError(`There is no user found with the given ID → ${userId}`),
    );
  }

  const fieldMap = {
    user: 'mutedUsers',
    comment: 'mutedComments',
    replies: 'mutedReplies',
  };

  const field = fieldMap[targetType];
  const targetArray = user[field];

  const alreadyMuted = targetArray.includes(targetId) || false;

  if (action === 'mute') {
    if (!alreadyMuted) {
      targetArray.push(targetId);
    }
  } else if (action === 'unmute') {
    user[field] = targetArray.filter(
      (id) => id.toString() !== targetId.toString(),
    );
  }

  await user.save({ validateBeforeSave: false });

  return res.status(StatusCodes.OK).json({
    message: `${targetType} ${action}d successfully`,
    muted: user[field],
  });
});
