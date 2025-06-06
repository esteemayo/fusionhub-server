/* eslint-disable */

import { StatusCodes } from 'http-status-codes';
import asyncHandler from 'express-async-handler';

import Reply from '../models/reply.model.js';
import Post from '../models/post.model.js';
import Comment from '../models/comment.model.js';

import { NotFoundError } from '../errors/not.found.error.js';
import { ForbiddenError } from '../errors/forbidden.error.js';

import * as factory from './handler.factory.controller.js';

export const getRepliesByUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  let { page, limit } = req.query;

  page = Number(page) || 1;
  limit = Number(limit) || 6;

  const skip = (page - 1) * limit;

  const counts = await Reply.countDocuments({ author: userId });
  const hasMore = page * limit < counts;

  const numberOfPages = Math.ceil(counts / limit);

  const query = Reply.find({ author: userId });

  const replies = await query.skip(skip).limit(limit);

  return res.status(StatusCodes.OK).json({
    page,
    counts,
    numberOfPages,
    hasMore,
    replies,
  });
});

export const updateReply = asyncHandler(async (req, res, next) => {
  const { id: replyId } = req.params;
  const { id: userId, role } = req.user;

  const reply = await Reply.findById(replyId);

  if (!reply) {
    return next(
      new NotFoundError(
        `There is no reply found with the given ID → ${replyId}`,
      ),
    );
  }

  const comment = await Comment.findById(reply.comment);

  if (!comment) {
    return next(
      new NotFoundError(
        `There is no comment found with the given ID → ${reply.comment}`,
      ),
    );
  }

  const post = await Post.findById(reply.post);

  if (!post) {
    return next(
      new NotFoundError(
        `There is no post found with the given ID → ${reply.post}`,
      ),
    );
  }

  if (
    String(reply.author._id) === userId ||
    String(comment.author._id) === userId ||
    String(post.author._id) === userId ||
    role === 'admin'
  ) {
    const updatedPost = await Reply.findByIdAndUpdate(
      replyId,
      { $set: { ...req.body } },
      {
        new: true,
        runValidators: true,
      },
    );

    return res.status(StatusCodes.OK).json(updatedPost);
  }

  return next(new ForbiddenError('You are not allowed to perform this action'));
});

export const deleteReply = asyncHandler(async (req, res, next) => {
  const { id: replyId } = req.params;
  const { id: userId, role } = req.user;

  const reply = await Reply.findById(replyId);

  if (!reply) {
    return next(
      new NotFoundError(
        `There is no reply found with the given ID → ${replyId}`,
      ),
    );
  }

  const comment = await Comment.findById(reply.comment);

  if (!comment) {
    return next(
      new NotFoundError(
        `There is no comment found with the given ID → ${reply.comment}`,
      ),
    );
  }

  const post = await Post.findById(reply.post);

  if (!post) {
    return next(
      new NotFoundError(
        `There is no post found with the given ID → ${reply.post}`,
      ),
    );
  }

  if (
    String(reply.author._id) === userId ||
    String(comment.author._id) === userId ||
    String(post.author._id) === userId ||
    role === 'admin'
  ) {
    await Reply.findByIdAndDelete(replyId);

    return res.status(StatusCodes.NO_CONTENT).end();
  }

  return next(new ForbiddenError('You are not allowed to perform this action'));
});

export const getReplies = factory.getAll(Reply);
export const getReply = factory.getOneById(Reply, 'reply');
export const createReply = factory.createOne(Reply);
