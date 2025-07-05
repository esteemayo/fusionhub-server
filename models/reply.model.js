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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

replySchema.pre(/^find/, function (next) {
  this.populate({
    path: 'comment',
    select: 'author',
  })

  this.populate({
    path: 'post',
    select: 'author',
  });

  this.populate({
    path: 'author',
    select: 'name username image role',
  });

  next();
});

const Reply = mongoose.models.Reply || mongoose.model('Reply', replySchema);

export default Reply;
