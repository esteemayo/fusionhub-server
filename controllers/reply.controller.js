/* eslint-disable */

import { StatusCodes } from 'http-status-codes';
import asyncHandler from 'express-async-handler';

import Reply from '../models/reply.model.js';
import Post from '../models/post.model.js';
import Comment from '../models/comment.model.js';

import { NotFoundError } from '../errors/not.found.error.js';
import { ForbiddenError } from '../errors/forbidden.error.js';

import * as factory from './handler.factory.controller.js';
import { buildReplyTree } from '../utils/build.reply.tree.js';

export const getRepliesByComment = asyncHandler(async (req, res, next) => {
  const { commentId } = req.params;

  const replies = await Reply.find({ comment: commentId })
    .populate('comment', 'author')
    .populate('post', 'author')
    .populate('author', 'name username image role fromGoogle')
    .lean();

  const tree = buildReplyTree(replies);

  return res.status(StatusCodes.OK).json(tree);
});

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

  const replies = await query
    .skip(skip)
    .limit(limit)
    .sort('-createdAt')
    .populate('comment', 'author')
    .populate('post', 'author')
    .populate('author', 'name username image role fromGoogle')
    .lean();

  return res.status(StatusCodes.OK).json({
    page,
    counts,
    numberOfPages,
    hasMore,
    replies,
  });
});

export const createReply = asyncHandler(async (req, res, next) => {
  const { parentReplyId } = req.body;

  if (!req.body.post) req.body.post = req.params.postId;
  if (!req.body.author) req.body.author = req.user.id;
  if (!req.body.comment) req.body.comment = req.params.comentId;

  const reply = await Reply.create({
    ...req.body,
    parentReply: parentReplyId || null,
  });

  if (parentReplyId) {
    await Reply.findByIdAndUpdate(
      parentReplyId,
      {
        $push: { replies: reply._id },
      },
      {
        timestamps: false,
      },
    );
  }

  return res.status(StatusCodes.CREATED).json(reply);
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
          `There is no user found with the given ID → ${reply.author._id}`,
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

  const canUpdate =
    isReplyAuthor ||
    isCommentAuthor ||
    isPostAuthor ||
    (post.author.role === 'admin' && (isCommentAuthor || isPostAuthor)) ||
    (comment.author.role === 'admin' && (isCommentAuthor || isPostAuthor));

  if (canUpdate) {
    return updateAndRespond();
  }

  return next(new ForbiddenError('You are not allowed to perform this action'));
});

export const likeReply = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.user;
  const { id: replyId } = req.params;

  const reply = await Reply.findById(replyId);

  if (!reply) {
    return next(
      new NotFoundError(
        `There is no reply found with the given ID → ${replyId}`,
      ),
    );
  }

  const hasLiked = reply.likes.some((like) => String(like) === userId) || false;
  const hasDisliked =
    reply.dislikes.some((dislike) => String(dislike) === userId) || false;

  let update = {};

  if (hasLiked) {
    update = {
      $pull: { likes: userId },
      $inc: { likeCount: -1 },
    };
  } else if (hasDisliked) {
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

  const updatedReply = await Reply.findByIdAndUpdate(replyId, update, {
    new: true,
    timestamps: false,
    runValidators: true,
  });

  return res.status(StatusCodes.OK).json(updatedReply);
});

export const dislikeReply = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.user;
  const { id: replyId } = req.params;

  const reply = await Reply.findById(replyId);

  if (!reply) {
    return next(
      new NotFoundError(
        `There is no reply found with the given ID → ${replyId}`,
      ),
    );
  }

  const hasLiked = reply.likes.includes(userId) || false;
  const hasDisliked = reply.dislikes.includes(userId) || false;

  let update = {};

  if (hasDisliked) {
    update = {
      $pull: { dislikes: userId },
      $inc: { dislikeCount: -1 },
    };
  } else if (hasLiked) {
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

  const updatedReply = await Reply.findByIdAndUpdate(replyId, update, {
    new: true,
    timestamps: false,
    runValidators: true,
  });

  return res.status(StatusCodes.OK).json(updatedReply);
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
          `There is no user found with the given ID → ${reply.author._id}`,
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

  const canDelete =
    isReplyAuthor ||
    isCommentAuthor ||
    isPostAuthor ||
    (post.author.role === 'admin' && (isCommentAuthor || isPostAuthor)) ||
    (comment.author.role === 'admin' && (isCommentAuthor || isPostAuthor));

  if (canDelete) {
    await Reply.findByIdAndDelete(replyId);
    return res.status(StatusCodes.NO_CONTENT).end();
  }

  return next(new ForbiddenError('You are not allowed to perform this action'));
});

export const getReplies = factory.getAll(Reply);
export const getReply = factory.getOneById(Reply, 'reply');
