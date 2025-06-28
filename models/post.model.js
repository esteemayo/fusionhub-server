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
    img: {
      type: String,
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
      validate: {
        validator: function (val) {
          return val && val.length > 0;
        },
        message: 'A post must have at least one tag',
      },
      set: (tags) => tags.map((tag) => tag.toLowerCase()),
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
    select: 'name username image',
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
      $project: {
        _id: 0,
        tag: '$_id',
        count: 1,
      },
    },
    {
      $match: {
        count: { $gte: 2 },
      },
    },
    {
      $sample: { size: 10 },
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
        isFeatured: true,
        views: { $gte: 100 },
      },
    },
    {
      $lookup: {
        from: 'comments',
        localField: '_id',
        foreignField: 'post',
        as: 'comments',
      },
    },
    {
      $project: {
        title: 1,
        desc: 1,
        img: 1,
        slug: 1,
        comments: 1,
        createdAt: 1,
      },
    },
    {
      $sample: { size: 5 },
    },
    {
      $sort: {
        views: -1,
        likeCount: -1,
        createdAt: -1,
      },
    },
  ]);

  return posts;
};

postSchema.statics.getRandomPosts = async function () {
  const posts = await this.aggregate([
    {
      $match: {
        views: { $gte: 100 },
        isFeatured: false,
        likeCount: { $gte: 10 },
      },
    },
    {
      $project: {
        title: 1,
        category: 1,
        img: 1,
        slug: 1,
      },
    },
    {
      $sample: { size: 2 },
    },
    {
      $sort: {
        views: -1,
        likeCount: -1,
        createdAt: -1,
      },
    },
  ]);

  return posts;
};

postSchema.statics.getTopPost = async function () {
  const posts = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) },
        views: { $gte: 100 },
      },
    },
    {
      $project: {
        title: 1,
        tags: 1,
        slug: 1,
        createdAt: 1,
      },
    },
    {
      $sort: {
        views: -1,
        likeCount: -1,
        createdAt: -1,
      },
    },
    {
      $limit: 5,
    },
  ]);

  return posts;
};

const Post = mongoose.models.Post || mongoose.model('Post', postSchema);

export default Post;
