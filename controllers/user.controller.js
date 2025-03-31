/* eslint-disable */

import { StatusCodes } from 'http-status-codes';
import _ from 'lodash';
import asyncHandler from 'express-async-handler';

import User from '../models/user.model.js';
import Post from '../models/post.model.js';

import Comment from '../models/comment.model.js';
import ReplyComment from '../models/reply.comment.model.js';

import { NotFoundError } from '../errors/not.found.error.js';
import { BadRequesError } from './../errors/bad.request.error.js';

import * as factory from './handler.factory.controller.js';
import { createSendToken } from '../utils/create.send.token.util.js';

export const getUsers = asyncHandler(async (req, res, next) => {
  const query = req.query.new;

  const users = query
    ? await User.find().sort('-createdAt').limit(5)
    : await User.find().sort('-_id');

  return res.status(StatusCodes.OK).json(users);
});

export const getUserStats = asyncHandler(async (req, res, next) => {
  const stats = await User.getUserStats();

  return res.status(StatusCodes.OK).json(stats);
});

export const updateMe = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.user;
  const { password, passwordConfirm } = req.body;

  if (password || passwordConfirm) {
    return next(
      new BadRequesError(
        `This route is not for password updates. Please use ${req.protocol}://${req.get('host')}/api/v1/auth/update-my-password`,
      ),
    );
  }

  const user = await User.findById(userId);

  if (!user) {
    return next(
      new NotFoundError(`There is no user found with the given ID → ${userId}`),
    );
  }

  const filterBody = _.pick(req.body, [
    'name',
    'username',
    'email',
    'phone',
    'dateOfBirth',
    'country',
    'bio',
    'about',
    'image',
  ]);

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: { ...filterBody } },
    {
      new: true,
      runValidators: true,
    },
  );

  return createSendToken(updatedUser, StatusCodes.OK, req, res);
});

export const deleteMe = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.user;

  const user = await User.findById(userId);

  if (!user) {
    return next(
      new NotFoundError(`There is no user found with the given ID → ${userId}`),
    );
  }

  await User.findByIdAndUpdate(userId, { $set: { isActive: false } });

  await Comment.deleteMany({ author: userId });
  await Post.deleteMany({ author: userId });
  await ReplyComment.deleteMany({ author: userId });

  return res.status(StatusCodes.NO_CONTENT).end();
});

export const deleteAvatar = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.user;

  const user = await User.findById(userId);

  if (!user) {
    return next(
      new NotFoundError(`There is no user found with the given ID → ${userId}`),
    );
  }

  user.image = undefined;
  await user.save({ validateBeforeSave: false });

  return createSendToken(user, StatusCodes.OK, req, res);
});

export const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

export const createUser = (req, res, next) => {
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: 'fail',
    message: `This route is not defined! Please use ${req.protocol}://${req.get('host')}/api/v1/auth/register`,
  });
};

export const getUser = factory.getOneById(User, 'user');
export const updateUser = factory.updateOne(User, 'user');
export const deleteUser = factory.deleteOne(User, 'user');
