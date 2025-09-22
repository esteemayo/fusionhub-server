import mongoose from 'mongoose';

const { Types, Schema } = mongoose;

const replySchema = new Schema(
  {
    content: {
      type: String,
      trim: true,
      required: [true, 'A reply must have a content'],
    },
    comment: {
      type: Types.ObjectId,
      ref: 'Comment',
      required: [true, 'A reply must have a comment'],
    },
    post: {
      type: Types.ObjectId,
      ref: 'Post',
      required: [true, 'A reply must belong to a post'],
    },
    author: {
      type: Types.ObjectId,
      ref: 'User',
      required: [true, 'A reply must belong to an author'],
    },
    parentReply: {
      type: Types.ObjectId,
      ref: 'Reply',
      default: null,
    },
    replies: [
      {
        type: Types.ObjectId,
        ref: 'Reply',
      },
    ],
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

replySchema.index({ _id: -1, likes: -1 }, { unique: true });
replySchema.index({ _id: 1, dislikes: 1 }, { unique: true });

// replySchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'comment',
//     select: 'author',
//   });

//   this.populate({
//     path: 'post',
//     select: 'author',
//   });

//   this.populate({
//     path: 'author',
//     select: 'name username image role fromGoogle',
//   });

//   this.populate({
//     path: 'replies',
//     populate: {
//       path: 'author',
//       select: 'name username image role fromGoogle',
//     },
//   });

//   next();
// });

const Reply = mongoose.models.Reply || mongoose.model('Reply', replySchema);

export default Reply;
