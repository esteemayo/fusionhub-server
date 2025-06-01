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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

commentSchema.virtual('replies', {
  ref: 'Reply',
  localField: '_id',
  foreignField: 'comment',
});

commentSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'author',
    select: 'name username image',
  });

  next();
});

const Comment =
  mongoose.models.Comment || mongoose.model('Comment', commentSchema);

export default Comment;
