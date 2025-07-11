/* eslint-disable */

import { StatusCodes } from 'http-status-codes';
import _ from 'lodash';
import asyncHandler from 'express-async-handler';

import User from '../models/user.model.js';
import Post from '../models/post.model.js';

import Reply from '../models/reply.model.js';
import Comment from '../models/comment.model.js';

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

export const getUserByUsername = asyncHandler(async (req, res, next) => {
  const { username } = req.params;

  const user = await User.findOne({ username });

  if (!user) {
    return next(
      new NotFoundError(
        `There is no user found with the given username → ${username}`,
      ),
    );
  }

  return res.status(StatusCodes.OK).json(user);
});

export const getUserStats = asyncHandler(async (req, res, next) => {
  const stats = await User.getUserStats();

  return res.status(StatusCodes.OK).json(stats);
});

export const getUserSavedPosts = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.user;

  const user = await User.findById(userId)
    .populate('savedPosts')
    .sort('-createdAt');

  if (!user) {
    return next(
      new NotFoundError(`There is no user found with the given ID → ${userId}`),
    );
  }

  return res.status(StatusCodes.OK).json(user.savedPosts);
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

export const savePost = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const { id: userId } = req.user;

  const user = await User.findById(userId);

  if (!user) {
    return next(
      new NotFoundError(`There is no user found with the given ID → ${userId}`),
    );
  }

  const isSaved = user.savedPosts.some((post) => String(post) === postId);

  let update = {};

  if (!isSaved) {
    update = {
      $push: { savedPosts: postId },
    };

    await Post.findByIdAndUpdate(
      postId,
      {
        $push: { savedBy: userId },
        $inc: { savedCount: 1 },
      },
      {
        new: true,
        timestamps: false,
        runValidators: true,
      },
    );
  } else {
    update = {
      $pull: { savedPosts: postId },
    };

    await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { savedBy: userId },
        $inc: { savedCount: -1 },
      },
      {
        new: true,
        timestamps: false,
        runValidators: true,
      },
    );
  }

  const updatedUser = await User.findByIdAndUpdate(userId, update, {
    new: true,
    timestamps: false,
    runValidators: true,
  });

  setTimeout(() => {
    return res.status(StatusCodes.OK).json(updatedUser);
  }, 3000);
});

export const deleteMe = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.user;

  const user = await User.findById(userId);

  if (!user) {
    return next(
      new NotFoundError(`There is no user found with the given ID → ${userId}`),
    );
  }

  await User.findByIdAndUpdate(userId, {
    $set: { isActive: false, savedPosts: [] },
  });

  await Reply.deleteMany({ author: userId });
  await Post.deleteMany({ author: userId });
  await Comment.deleteMany({ author: userId });

  await Post.updateMany(
    { likes: userId },
    {
      $pull: { likes: userId },
      $inc: { likeCount: -1 },
    },
    {
      timestamps: false,
    },
  );

  await Post.updateMany(
    { dislikes: userId },
    {
      $pull: { dislikes: userId },
      $inc: { dislikeCount: -1 },
    },
    {
      timestamps: false,
    },
  );

  await Post.updateMany(
    { savedBy: userId },
    {
      $pull: { savedBy: userId },
      $inc: { savedCount: -1 },
    },
    {
      timestamps: false,
    },
  );

  await Comment.updateMany(
    { likes: userId },
    {
      $pull: { likes: userId },
      $inc: { likeCount: -1 },
    },
    {
      timestamps: false,
    },
  );

  await Reply.updateMany(
    { likes: userId },
    {
      $pull: { likes: userId },
      $inc: { likeCount: -1 },
    },
    {
      timestamps: false,
    },
  );

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

export const deleteBanner = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.user;

  let user = await User.findById(userId);

  if (!user) {
    return next(
      new NotFoundError(`There is no user found with the given ID → ${userId}`),
    );
  }

  user.banner = undefined;
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
