/* eslint-disable */

import mongoose from 'mongoose';

const { Types, Schema } = mongoose;

const commentSchema = new Schema(
  {
    content: {
      type: String,
      trim: true,
      required: [true, 'A comment must have a content'],
    },
    post: {
      type: Types.ObjectId,
      ref: 'Post',
      required: [true, 'A comment must belong to a post'],
    },
    author: {
      type: Types.ObjectId,
      ref: 'User',
      required: [true, 'A comment must belong to an author'],
    },
    likes: [
      {
        type: Types.ObjectId,
        ref: 'User',
      },
    ],
    dislikes: [
      {
        type: Types.ObjectId,
        ref: 'User',
      },
    ],
    likeCount: {
      type: Number,
      default: 0,
    },
    dislikeCount: {
      type: Number,
      default: 0,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

commentSchema.index({ _id: 1, likes: 1 }, { unique: true });
commentSchema.index({ _id: -1, dislikes: -1 }, { unique: true });

commentSchema.virtual('replies', {
  ref: 'Reply',
  localField: '_id',
  foreignField: 'comment',
});

commentSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'post',
    select: 'author',
  });

  this.populate({
    path: 'author',
    select: 'name email username image role fromGoogle',
  });

  next();
});

commentSchema.pre(/^find/, function (next) {
  if (this._mongooseOptions && this._mongooseOptions.user) {
    const blockedUsers = this._mongooseOptions.user.blockedUsers || [];
    if (blockedUsers.length) {
      this.where({ author: { $nin: blockedUsers } });
    }
  }

  next();
});

const Comment =
  mongoose.models.Comment || mongoose.model('Comment', commentSchema);

export default Comment;
