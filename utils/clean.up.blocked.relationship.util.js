/* eslint disable */

import Reply from '../models/reply.model.js';
import Post from '../models/post.model.js';
import Comment from '../models/comment.model.js';
import User from '../models/user.model.js';

export const cleanUpBlockedRelationship = async (userAId, userBId) => {
  const userAPosts = await Post.find({ author: userAId }).select('_id');
  const userBPosts = await Post.find({ author: userAId }).select('_id');

  const userAPostIds = userAPosts.map((post) => post._id.toString());
  const userBPostIds = userBPosts.map((post) => post._id.toString());

  await User.updateMany(
    { _id: userAId },
    {
      $pull: {
        savedPosts: { $in: userBPostIds },
      },
    },
  );

  await User.updateMany(
    { _id: userBId },
    {
      $pull: {
        savedPosts: { $in: userAPostIds },
      },
    },
  );

  await Post.updateMany(
    { author: userAId },
    {
      $pull: {
        likes: userBId,
        dislikes: userBId,
      },
      $inc: {
        likeCount: -1,
        dislikeCount: -1,
      },
    },
  );

  await Post.updateMany(
    { author: userBId },
    {
      $pull: {
        likes: userAId,
        dislikes: userAId,
      },
      $inc: {
        likeCount: -1,
        dislikeCount: -1,
      },
    },
  );

  await Post.updateMany(
    { savedBy: userAId },
    {
      $pull: { savedBy: userAId },
      $inc: { savedCount: -1 },
    },
  );

  await Post.updateMany(
    { savedBy: userBId },
    {
      $pull: { savedBy: userBId },
      $inc: { savedCount: -1 },
    },
  );

  await Comment.updateMany(
    { author: userAId },
    {
      $pull: {
        likes: userBId,
        dislikes: userBId,
      },
      $inc: {
        likeCount: -1,
        dislikeCount: -1,
      },
    },
  );

  await Comment.updateMany(
    { author: userBId },
    {
      $pull: {
        likes: userAId,
        dislikes: userAId,
      },
      $inc: {
        likeCount: -1,
        dislikeCount: -1,
      },
    },
  );

  await Reply.updateMany(
    { author: userAId },
    {
      $pull: {
        likes: userBId,
        dislikes: userBId,
      },
      $inc: {
        likeCount: -1,
        dislikeCount: -1,
      },
    },
  );

  await Reply.updateMany(
    { author: userBId },
    {
      $pull: {
        likes: userAId,
        dislikes: userAId,
      },
      $inc: {
        likeCount: -1,
        dislikeCount: -1,
      },
    },
  );

  return;
};
