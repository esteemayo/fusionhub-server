/* eslint-disable */

import { StatusCodes } from 'http-status-codes';
import asyncHandler from 'express-async-handler';

import Reply from '../models/reply.model.js';
import Post from '../models/post.model.js';
import Comment from '../models/comment.model.js';

import { NotFoundError } from '../errors/not.found.error.js';
import { ForbiddenError } from '../errors/forbidden.error.js';

import * as factory from './handler.factory.controller.js';

export const getCommentsByUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  let { page, limit } = req.query;

  page = page * 1 || 1;
  limit = limit * 1 || 6;

  const skip = (page - 1) * limit;

  const counts = await Comment.countDocuments({ author: userId });
  const hasMore = page * limit < counts;

  const numberOfPages = Math.ceil(counts / limit);

  const query = Comment.find({ author: userId });

  const comments = await query.skip(skip).limit(limit).sort('-_id');

  return res.status(StatusCodes.OK).json({
    page,
    counts,
    numberOfPages,
    hasMore,
    comments,
  });
});

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

  const isCommentAuthor = String(comment.author._id) === userId;
  const isPostAuthor = String(post.author._id) === userId;

  const updateAndRespond = async () => {
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { $set: { ...req.body } },
      {
        new: true,
        runValidators: true,
      },
    );

    return res.status(StatusCodes.OK).json(updatedComment);
  };

  if (role === 'admin') {
    const commentAuthor = comment.author;

    if (!commentAuthor) {
      return next(
        new NotFoundError(
          `There is no user found with the given ID → ${comment.author._id}`,
        ),
      );
    }

    if (isCommentAuthor) {
      return updateAndRespond();
    }

    if (commentAuthor.role === 'admin') {
      return next(
        new ForbiddenError('Admins cannot update comments from other admins'),
      );
    }

    return updateAndRespond();
  }

  const canUpdate =
    isCommentAuthor ||
    isPostAuthor ||
    (post.author.role === 'admin' && (isCommentAuthor || isPostAuthor));

  if (canUpdate) {
    return updateAndRespond();
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

  const isCommentAuthor = String(comment.author._id) === userId;
  const isPostAuthor = String(post.author._id) === userId;

  if (role === 'admin') {
    const commentAuthor = comment.author;

    if (!commentAuthor) {
      return next(
        new NotFoundError(
          `There is no user found with the given ID → ${comment.author._id}`,
        ),
      );
    }

    if (isCommentAuthor) {
      await Comment.findByIdAndDelete(commentId);
      await Reply.deleteMany({ comment: commentId });

      return res.status(StatusCodes.NO_CONTENT).end();
    }

    if (commentAuthor.role === 'admin') {
      return next(
        new ForbiddenError('Admins cannot delete comments from other admins'),
      );
    }

    await Comment.findByIdAndDelete(commentId);
    await Reply.deleteMany({ comment: commentId });

    return res.status(StatusCodes.NO_CONTENT).end();
  }

  const canDelete =
    isCommentAuthor ||
    isPostAuthor ||
    (post.author.role === 'admin' && (isCommentAuthor || isPostAuthor));

  if (canDelete) {
    await Comment.findByIdAndDelete(commentId);
    await Reply.deleteMany({ comment: commentId });

    return res.status(StatusCodes.NO_CONTENT).end();
  }

  return next(new ForbiddenError('You are not allowed to perform this action'));
});

export const getComments = factory.getAll(Comment, 'replies');
export const getComment = factory.getOneById(Comment, 'replies');
export const createComment = factory.createOne(Comment);
