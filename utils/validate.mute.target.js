import mongoose from 'mongoose';

import Reply from '../models/reply.model.js';
import User from '../models/user.model.js';
import Comment from '../models/comment.model.js';

import { NotFoundError } from '../errors/not.found.error.js';
import { BadRequestError } from '../errors/bad.request.error.js';

const { Types } = mongoose;

export const validateMuteTarget = async (targetId, targetType) => {
  if (!Types.ObjectId.isValid(targetId)) {
    throw new BadRequestError('Invalid target ID format');
  }

  const normalizedType =
    targetType.charAt(0).toUpperCase() + targetType.slice(1).toLowerCase();

  const ModelMap = {
    User,
    Comment,
    Reply,
  };

  const Model = ModelMap[normalizedType];

  if (!Model) {
    throw new BadRequestError(
      `Invalid targetType: ${targetType}. Must be one of 'User', 'Comment', or 'Reply'`,
    );
  }

  const exists = await Model.exists({ _id: targetId });

  if (!exists) {
    throw new NotFoundError(
      `There is no ${normalizedType} found with ID → ${targetId}`,
    );
  }

  return normalizedType;
};
