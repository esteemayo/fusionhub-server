/* eslint-disable */

import { StatusCodes } from 'http-status-codes';
import asyncHandler from 'express-async-handler';

import Reply from '../models/reply.model.js';
import Post from '../models/post.model.js';
import Comment from '../models/comment.model.js';
import User from '../models/user.model.js';

import { ForbiddenError } from '../errors/forbidden.error.js';
import { NotFoundError } from '../errors/not.found.error.js';
import { BadRequestError } from '../errors/bad.request.error.js';

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

export const reportComment = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;
  const { id: userId } = req.user;
  const { id: commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return next(
      new NotFoundError(
        `There is no comment found with the given ID → ${commentId}`,
      ),
    );
  }

  const isReported = comment.reports.some((report) =>
    report.user.equal(userId),
  );

  if (isReported) {
    return next(new BadRequestError('You already reported this comment'));
  }

  comment.reports.push({ user: userId, reason });
  await comment.save();

  return res.status(StatusCodes.OK).json({ message: 'Comment reported' });
});

export const muteComment = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.user;
  const { id: commentId } = req.params;

  const user = await User.findById(userId);

  const index = user.mutedComments.indexOf(commentId);

  if (index > -1) {
    user.mutedComments.splice(index, 1);
    await user.save();

    return res.status(StatusCodes.OK).json({ message: 'Comment unmuted' });
  } else {
    user.mutedComments.push(commentId);
    await user.save();

    return res.status(StatusCodes.OK).json({ message: 'Comment muted' });
  }
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

export const likeComment = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.user;
  const { id: commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return next(
      new NotFoundError(
        `There is no comment found with the given ID → ${commentId}`,
      ),
    );
  }

  const isLiked =
    comment.likes.some((like) => String(like) === userId) || false;

  const isDisliked =
    comment.dislikes.some((dislike) => String(dislike) === userId) || false;

  let update = {};

  if (isLiked) {
    update = {
      $pull: { likes: userId },
      $inc: { likeCount: -1 },
    };
  } else if (isDisliked) {
    update = {
      $pull: { dislikes: userId },
      $addToSet: { likes: userId },
      $inc: { dislikeCount: -1, likeCount: 1 },
    };
  } else {
    update = {
      $addToSet: { likes: userId },
      $inc: { likeCount: 1 },
    };
  }

  const updatedComment = await Comment.findByIdAndUpdate(commentId, update, {
    new: true,
    timestamps: false,
    runValidators: true,
  });

  return res.status(StatusCodes.OK).json(updatedComment);
});

export const dislikeComment = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.user;
  const { id: commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return next(
      new NotFoundError(
        `There is no comment found with the given ID → ${commentId}`,
      ),
    );
  }

  const isLiked = comment.likes.includes(userId) || false;
  const isDisliked = comment.dislikes.includes(userId) || false;

  let update = {};

  if (isDisliked) {
    update = {
      $pull: { dislikes: userId },
      $inc: { dislikeCount: -1 },
    };
  } else if (isLiked) {
    update = {
      $pull: { likes: userId },
      $addToSet: { dislikes: userId },
      $inc: { likeCount: -1, dislikeCount: 1 },
    };
  } else {
    update = {
      $addToSet: { dislikes: userId },
      $inc: { dislikeCount: 1 },
    };
  }

  const updatedComment = await Comment.findByIdAndUpdate(commentId, update, {
    new: true,
    timestamps: false,
    runValidators: true,
  });

  return res.status(StatusCodes.OK).json(updatedComment);
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
