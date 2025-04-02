import slugify from 'slugify';
import mongoose from 'mongoose';

const { Schema, Types } = mongoose;

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'A post must have a title'],
      trim: true,
    },
    desc: {
      type: String,
      required: [true, 'A post must have description'],
      trim: true,
    },
    category: {
      type: String,
      lowerCase: true,
      default: 'general',
    },
    isFeatured: {
      type: Boolean,
      default: false,
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
    tags: {
      type: [String],
      validate: function (val) {
        return val && val.length > 0;
      },
      message: 'A product must have at least one tag',
    },
    views: {
      type: Number,
      default: 0,
    },
    author: {
      type: Types.ObjectId,
      ref: 'User',
      required: [true, 'A post must have an author'],
    },
    slug: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

postSchema.index({
  title: 'text',
  desc: 'text',
});

postSchema.index({ title: 1 });
postSchema.index({ slug: -1 });

postSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
});

postSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'author',
    select: 'name image',
  });

  next();
});

postSchema.pre('save', async function (next) {
  if (!this.isModified('title')) return next();

  this.slug = slugify(this.title, { lower: true, trim: true });

  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const postWithSlug = await this.constructor.find({ slug: slugRegEx });

  if (postWithSlug.length) {
    this.slug = `${this.slug}-${postWithSlug.length + 1}`;
  }
});

postSchema.statics.getTagsList = async function () {
  const tags = await this.aggregate([
    {
      $unwind: '$tags',
    },
    {
      $group: {
        _id: '$tags',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  return tags;
};

postSchema.statics.getFeaturedPosts = async function () {
  const posts = await this.aggregate([
    {
      $match: {
        featured: true,
        views: { $gte: 100 },
      },
    },
    {
      $sample: { size: 3 },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);

  return posts;
};

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

export default Post;
