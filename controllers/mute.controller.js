import { StatusCodes } from 'http-status-codes';
import asyncHandler from 'express-async-handler';

import User from '../models/user.model.js';
import { validateMuteTarget } from '../utils/validate.mute.target.util.js';

import { NotFoundError } from '../errors/not.found.error.js';
import { BadRequestError } from '../errors/bad.request.error.js';

export const getMutedEntities = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.user;

  const user = await User.findById(userId)
    .select('mutedUsers mutedComments mutedReplies')
    .populate({
      path: 'mutedUsers.targetId',
      model: 'User',
      select: 'username email name image',
    })
    .populate({
      path: 'mutedComments.targetId',
      model: 'Comment',
      select: 'content author createdAt',
    })
    .populate({
      path: 'mutedReplies.targetId',
      model: 'Reply',
      select: 'content author createdAt',
    });

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
      name: item.targetId.name,
      image: item.targetId.image,
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

  const mutedReplies = (user.mutedReplies ?? [])
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
  const { targetId, targetType, reason } = req.body;

  const normalizedType = await validateMuteTarget(targetId, targetType);

  const user = await User.findById(userId);

  if (!user) {
    return next(
      new NotFoundError(`There is no user found with the given ID → ${userId}`),
    );
  }

  const muteFieldMap = {
    User: 'mutedUsers',
    Comment: 'mutedComments',
    Reply: 'mutedReplies',
  };

  const muteField = muteFieldMap[normalizedType];

  if (!muteField) {
    return next(new BadRequestError('Invalid target type mapping'));
  }

  const alreadyMuted =
    user[muteField].some(
      (item) =>
        item.targetId.toString() === targetId &&
        item.targetType === normalizedType,
    ) || false;

  if (alreadyMuted) {
    user[muteField] = user[muteField].filter(
      (item) => item.targetId.toString() !== targetId,
    );

    await user.save({ validateBeforeSave: false });

    return res.status(StatusCodes.OK).json({
      message: `${normalizedType} unmuted successfully`,
      muted: user[muteField],
    });
  }

  user[muteField].push({
    targetId,
    targetType: normalizedType,
    reason,
    mutedAt: new Date(),
  });

  await user.save({ validateBeforeSave: false });

  return res.status(StatusCodes.OK).json({
    message: `${normalizedType} muted successfully`,
    muted: user[muteField],
    mutedAt: new Date(),
  });
});

export const unmuteTarget = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.user;
  const { targetId, targetType } = req.body;

  const normalizedType = await validateMuteTarget(targetId, targetType);

  const user = await User.findById(userId);

  if (!user) {
    return next(
      new NotFoundError(`There is no user found with the given ID → ${userId}`),
    );
  }

  const muteFieldMap = {
    User: 'mutedUsers',
    Comment: 'mutedComments',
    Reply: 'mutedReply',
  };

  const muteField = muteFieldMap[normalizedType];

  if (!muteField) {
    return next(new BadRequestError('Invalid target type mapping'));
  }

  user[muteField] = user[muteField].filter(
    (entry) =>
      entry.targetId.toString() !== targetId &&
      entry.targetType === normalizedType,
  );

  await user.save({ validateBeforeSave: false });

  return res.status(StatusCodes.OK).json({
    message: `${normalizedType} unmuted successfully`,
    muted: user[muteField],
  });
});
