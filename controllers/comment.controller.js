/* eslint-disable */

import { StatusCodes } from 'http-status-codes';
import asyncHandler from 'express-async-handler';

import Post from '../models/post.model.js';
import Comment from '../models/comment.model.js';

import { NotFoundError } from '../errors/not.found.error.js';
import { ForbiddenError } from '../errors/forbidden.error.js';

import * as factory from './handler.factory.controller.js';

export const updateComment = asyncHandler(async (req, res, next) => {
  const { id: commentId } = req.params;
  const { id: userId, role } = req.user;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return next(
      new NotFoundError(
        `There is no comment found with the given ID → ${commentId}`,
      ),
    );
  }

  const post = await Post.findById(comment.post);

  if (!post) {
    return next(
      new NotFoundError(
        `There is no post found with the given ID → ${comment.post}`,
      ),
    );
  }

  if (
    String(comment.author._id) === userId ||
    String(post.author._id) === userId ||
    role === 'admin'
  ) {
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { $set: { ...req.body } },
      {
        new: true,
        runValidators: true,
      },
    );

    return res.status(StatusCodes.OK).json(updatedComment);
  }

  return next(new ForbiddenError('You are not allowed to perform this action'));
});

export const deleteComment = asyncHandler(async (req, res, next) => {
  const { id: commentId } = req.params;
  const { id: userId, role } = req.user;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return next(
      new NotFoundError(
        `There is no comment found with the given ID → ${commentId}`,
      ),
    );
  }

  const post = await Post.findById(comment.post);

  if (!post) {
    return next(
      new NotFoundError(
        `There is no post found with the given ID → ${comment.post}`,
      ),
    );
  }

  if (
    String(comment.author._id) === userId ||
    String(post.author._id) === userId ||
    role === 'admin'
  ) {
    await Comment.findByIdAndDelete(commentId);

    return res.status(StatusCodes.NO_CONTENT).end();
  }

  return next(new ForbiddenError('You are not allowed to perform this action'));
});

export const getComments = factory.getAll(Comment, 'replies');
export const getComment = factory.getOneById(Comment, 'replies');
export const createComment = factory.createOne(Comment);
