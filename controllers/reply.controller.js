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

  const replies = await query.skip(skip).limit(limit).sort('-createdAt');

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

  const isReplyAuthor = String(reply.author._id) === userId;
  const isCommentAuthor = String(comment.author._id) === userId;
  const isPostAuthor = String(post.author._id) === userId;

  const updateAndRespond = async () => {
    const updatedReply = await Reply.findByIdAndUpdate(
      replyId,
      { $set: { ...req.body } },
      {
        new: true,
        runValidators: true,
      },
    );

    return res.status(StatusCodes.OK).json(updatedReply);
  };

  if (role === 'admin') {
    const replyAuthor = reply.author;

    if (!replyAuthor) {
      return next(
        new NotFoundError(
          `There is no user found with the given ID → ${reply.author?._id}`,
        ),
      );
    }

    if (isReplyAuthor) {
      return updateAndRespond();
    }

    if (replyAuthor.role === 'admin') {
      return next(
        new ForbiddenError('Admins cannot update replies from other admins'),
      );
    }

    return updateAndRespond();
  }

  if (
    isReplyAuthor ||
    isCommentAuthor ||
    isPostAuthor ||
    (post.author.role === 'admin' && isCommentAuthor) ||
    (post.author.role === 'admin' && isPostAuthor)
  ) {
    return updateAndRespond();
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

  const isReplyAuthor = String(reply.author._id) === userId;
  const isCommentAuthor = String(comment.author._id) === userId;
  const isPostAuthor = String(post.author._id) === userId;

  if (role === 'admin') {
    const replyAuthor = reply.author;

    if (!replyAuthor) {
      return next(
        new NotFoundError(
          `There is no user found with the given ID → ${reply.author?._id}`,
        ),
      );
    }

    if (isReplyAuthor) {
      await Reply.findByIdAndDelete(replyId);
      return res.status(StatusCodes.NO_CONTENT).end();
    }

    if (replyAuthor.role === 'admin') {
      return next(
        new ForbiddenError('Admins cannot delete replies from other admins'),
      );
    }

    await Reply.findByIdAndDelete(replyId);
    return res.status(StatusCodes.NO_CONTENT).end();
  }

  if (
    isReplyAuthor ||
    isCommentAuthor ||
    isPostAuthor ||
    (post.author.role === 'admin' && isCommentAuthor) ||
    (post.author.role === 'admin' && isPostAuthor)
  ) {
    await Reply.findByIdAndDelete(replyId);
    return res.status(StatusCodes.NO_CONTENT).end();
  }

  return next(new ForbiddenError('You are not allowed to perform this action'));
});

export const getReplies = factory.getAll(Reply);
export const getReply = factory.getOneById(Reply, 'reply');
export const createReply = factory.createOne(Reply);
