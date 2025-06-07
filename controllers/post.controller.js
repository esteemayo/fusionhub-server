/* eslint-disable */

import { StatusCodes } from 'http-status-codes';
import slugify from 'slugify';
import asyncHandler from 'express-async-handler';

import Post from '../models/post.model.js';
import User from '../models/user.model.js';
import Comment from '../models/comment.model.js';

import { NotFoundError } from '../errors/not.found.error.js';
import { ForbiddenError } from '../errors/forbidden.error.js';

import * as factory from './handler.factory.controller.js';

export const getPosts = asyncHandler(async (req, res, next) => {
  const queryObj = {};
  let {
    author,
    category,
    featured,
    fields,
    limit,
    numericFilter,
    page,
    sort,
    search,
    tag,
  } = req.query;

  if (author) {
    const user = await User.findOne({ username: author }).select('_id');

    if (!user) {
      return next(
        new NotFoundError(
          `There is no post found with the given USERNAME → ${author}`,
        ),
      );
    }

    queryObj.author = user._id;
  }

  if (category) {
    queryObj.category = category;
  }

  if (featured) {
    queryObj.isFeatured = featured === 'true' ? true : false;
  }

  if (search) {
    queryObj.title = { $regex: search, $options: 'i' };
  }

  if (tag) {
    queryObj.tags = { $in: [tag] };
  }

  if (numericFilter) {
    const operatorMap = {
      '>': '$gt',
      '>=': '$gte',
      '=': '$eq',
      '<': '$lt',
      '<=': '$lte',
    };

    const regEx = /\b(>|>=|=|<|<=)\b/g;
    let filters = numericFilter.replace(
      regEx,
      (match) => `-${operatorMap[match]}-`,
    );

    const options = ['views', 'likeCount', 'dislikeCount'];

    filters = filters.split(',').forEach((el) => {
      const [field, operator, value] = el.split('-');

      if (options.includes(field)) {
        queryObj[field] = { [operator]: Number(value) };
      }
    });
  }

  let query = Post.find(queryObj);

  if (sort) {
    let sortBy = sort.split(',').join(' ');

    switch (sort) {
      case 'newest':
        sortBy = '-createdAt';
        break;

      case 'oldest':
        sortBy = 'createdAt';
        break;

      case 'popular':
        sortBy = '-views';
        break;

      case 'trending':
        sortBy = '-views';
        queryObj.createdAt = {
          $gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
        };
        break;

      default:
        break;
    }

    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  if (fields) {
    const fieldsList = fields.split(',').join(' ');
    query = query.select(fieldsList);
  } else {
    query = query.select('-__v');
  }

  page = Number(page) || 1;
  limit = Number(limit) || 20;

  const skip = (page - 1) * limit;

  const counts = await Post.countDocuments();
  const hasMore = page * limit < counts;

  const numberOfPages = Math.ceil(counts / limit);
  query = query.skip(skip).limit(limit);

  const posts = await query;

  return res.status(StatusCodes.OK).json({
    page,
    counts,
    numberOfPages,
    hasMore,
    posts,
  });
});

export const getMyPosts = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.user;

  const posts = await Post.find({ author: userId });

  return res.status(StatusCodes.OK).json(posts);
});

export const getRandomPosts = asyncHandler(async (req, res, next) => {
  const posts = await Post.getRandomPosts();

  return res.status(StatusCodes.OK).json(posts);
});

export const getRecentPosts = asyncHandler(async (req, res, next) => {
  const posts = await Post.find().sort('-createdAt').limit(8);

  return res.status(StatusCodes.OK).json(posts);
});

export const getTopPost = asyncHandler(async (req, res, next) => {
  const posts = await Post.getTopPost();

  return res.status(StatusCodes.OK).json(posts);
});

export const getTrendingPosts = asyncHandler(async (req, res, next) => {
  const posts = await Post.find().sort('-views').limit(10);

  return res.status(StatusCodes.OK).json(posts);
});

export const getFeaturedPosts = asyncHandler(async (req, res, next) => {
  const posts = await Post.getFeaturedPosts();

  return res.status(StatusCodes.OK).json(posts);
});

export const getRelatedPosts = asyncHandler(async (req, res, next) => {
  const tags = req.query.tags.split(',');

  const posts = await Post.find({ tags: { $in: tags } })
    .limit(20)
    .sort('-createdAt');

  return res.status(StatusCodes.OK).json(posts);
});

export const getPostsByUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  let { page, limit } = req.query;

  page = +page || 1;
  limit = +limit || 6;

  const skip = (page - 1) * limit;

  const counts = await Post.countDocuments({ author: userId });
  const hasMore = page * limit < counts;

  const numberOfPages = Math.ceil(counts / limit);

  const query = Post.find({ author: userId });

  const posts = await query.skip(skip).limit(limit).populate('comments');

  return res.status(StatusCodes.OK).json({
    page,
    counts,
    numberOfPages,
    hasMore,
    posts,
  });
});

export const getPostsLikedByUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  let { page, limit } = req.query;

  page = +page || 1;
  limit = +limit || 6;

  const skip = (page - 1) * limit;

  const counts = await Post.countDocuments({ likes: { $in: [userId] } });
  const hasMore = page * limit < counts;

  const numberOfPages = Math.ceil(counts / limit);

  const query = Post.find({ likes: { $in: [userId] } });

  const posts = await query.skip(skip).limit(limit).populate('comments');

  return res.status(StatusCodes.OK).json({
    page,
    counts,
    numberOfPages,
    hasMore,
    posts,
  });
});

export const getPostsDislikedByUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  let { page, limit } = req.query;

  page = +page || 1;
  limit = +limit || 6;

  const skip = (page - 1) * limit;

  const counts = await Post.countDocuments({ dislikes: { $in: [userId] } });
  const hasMore = page * limit < counts;

  const numberOfPages = Math.ceil(counts / limit);

  const query = Post.find({ dislikes: { $in: [userId] } });

  const posts = await query.skip(skip).limit(limit).populate('comments');

  return res.status(StatusCodes.OK).json({
    page,
    counts,
    numberOfPages,
    hasMore,
    posts,
  });
});

export const getMyLikedPosts = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.user;

  const posts = await Post.find({ likes: userId }).sort('-_id');

  return res.status(StatusCodes.OK).json(posts);
});

export const getMyDislikedPosts = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.user;

  const posts = await Post.find({ dislikes: userId }).sort('-_id');

  return res.status(StatusCodes.OK).json(posts);
});

export const getPostCommentAuthors = asyncHandler(async (req, res, next) => {
  const { id: postId } = req.params;

  const comments = await Comment.find({ post: postId });
  const users = comments.map((comment) => comment.author);

  return res.status(StatusCodes.OK).json(users);
});

export const getPostCountsByCategory = asyncHandler(async (req, res, next) => {
  const generalCountPromise = Post.countDocuments({ category: 'general' });
  const techCountPromise = Post.countDocuments({ category: 'technology' });
  const lifeStyleCountPromise = Post.countDocuments({ category: 'lifestyle' });
  const musicCountPromise = Post.countDocuments({ category: 'music' });
  const fashionCountPromise = Post.countDocuments({ category: 'fashion' });
  const travelCountPromise = Post.countDocuments({ category: 'travel' });
  const sportCountPromise = Post.countDocuments({ category: 'sport' });
  const adventureCountPromise = Post.countDocuments({ category: 'adventure' });

  const [
    generalCount,
    techCount,
    lifeStyleCount,
    musicCount,
    fashionCount,
    travelCount,
    sportCount,
    adventureCount,
  ] = await Promise.all([
    generalCountPromise,
    techCountPromise,
    lifeStyleCountPromise,
    musicCountPromise,
    fashionCountPromise,
    travelCountPromise,
    sportCountPromise,
    adventureCountPromise,
  ]);

  const responseData = [
    { category: 'general', count: generalCount },
    { category: 'technology', count: techCount },
    { category: 'lifestyle', count: lifeStyleCount },
    { category: 'music', count: musicCount },
    { category: 'fashion', count: fashionCount },
    { category: 'travel', count: travelCount },
    { category: 'sport', count: sportCount },
    { category: 'adventure', count: adventureCount },
  ];

  return res.status(StatusCodes.OK).json(responseData);
});

export const getPostsForCategory = asyncHandler(async (req, res, next) => {
  const { category } = req.params;

  const posts = await Post.find({ category }).sort('-_id');

  return res.status(StatusCodes.OK).json(posts);
});

export const getTags = asyncHandler(async (req, res, next) => {
  const tags = await Post.getTagsList();

  return res.status(StatusCodes.OK).json(tags);
});

export const getPostsByTag = asyncHandler(async (req, res, next) => {
  const { tag } = req.params;
  const tagQuery = tag || { $exists: true };

  const posts = await Post.find({ tags: { $in: [tagQuery] } }).sort(
    '-createdAt',
  );

  return res.status(StatusCodes.OK).json(posts);
});

export const searchPosts = asyncHandler(async (req, res, next) => {
  let { limit, page, q } = req.query;

  page = Number(page) || 1;
  limit = Number(limit) || 20;

  const skip = (page - 1) * limit;

  const counts = await Post.countDocuments({ $text: { $search: q } });
  const hasMore = page * limit < counts;

  const numberOfPages = Math.ceil(counts / limit);

  const query = Post.find(
    {
      $text: {
        $search: q,
      },
    },
    {
      score: {
        $meta: 'textScore',
      },
    },
  );

  const posts = await query
    .skip(skip)
    .limit(limit)
    .sort({
      score: {
        $meta: 'textScore',
      },
    });

  return res.status(StatusCodes.OK).json({
    page,
    counts,
    numberOfPages,
    hasMore,
    posts,
  });
});

export const updatePost = asyncHandler(async (req, res, next) => {
  const { id: postId } = req.params;
  const { id: userId, role } = req.user;

  const post = await Post.findById(postId);

  if (!post) {
    return next(
      new NotFoundError(`There is no post found with the given ID → ${postId}`),
    );
  }

  if (String(post.author) !== userId || role !== 'admin') {
    return next(
      new ForbiddenError(
        'You do not have permission to perform this operation',
      ),
    );
  }

  if (req.body.title)
    req.body.slug = slugify(req.body.title, { lower: true, trim: true });

  const updatedPost = await Post.findByIdAndUpdate(
    postId,
    { $set: { ...req.body } },
    {
      new: true,
      runValidators: true,
    },
  );

  return res.status(StatusCodes.OK).json(updatedPost);
});

export const featurePost = asyncHandler(async (req, res, next) => {
  const { id: postId } = req.params;

  const post = await Post.findById(postId);

  if (!post) {
    return next(
      new NotFoundError(`There is no post found with the given ID → ${postId}`),
    );
  }

  const isFeatured = !!post.isFeatured;

  const updatedPost = await Post.findByIdAndUpdate(
    postId,
    { $set: { isFeatured: !isFeatured } },
    {
      new: true,
      runValidators: true,
    },
  );

  return res.status(StatusCodes.OK).json(updatedPost);
});

export const updateViews = asyncHandler(async (req, res, next) => {
  const { id: postId } = req.params;

  const post = await Post.findById(postId);

  if (!post) {
    return next(
      new NotFoundError(`There is no post found with the given ID → ${postId}`),
    );
  }

  const updatedViews = await Post.findByIdAndUpdate(
    postId,
    { $inc: { views: 1 } },
    {
      new: true,
      runValidators: true,
    },
  );

  return res.status(StatusCodes.OK).json(updatedViews);
});

export const likePost = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.user;
  const { id: postId } = req.params;

  const post = await Post.findById(postId);

  if (!post) {
    return next(
      new NotFoundError(`There is no post found with the given ID → ${postId}`),
    );
  }

  const isLiked = post.likes.some((id) => String(id) === userId);
  const isDisliked = post.dislikes.some((id) => String(id) === userId);

  let update = {};

  if (isDisliked) {
    update = {
      $pull: { dislikes: userId },
      $addToSet: { likes: userId },
      $inc: { dislikeCount: -1, likeCount: 1 },
    };
  } else if (isLiked) {
    update = {
      $pull: { likes: userId },
      $inc: { likeCount: -1 },
    };
  } else {
    update = {
      $addToSet: { likes: userId },
      $inc: { likeCount: 1 },
    };
  }

  const updatedPost = await Post.findByIdAndUpdate(postId, update, {
    new: true,
    runValidators: true,
  });

  return res.status(StatusCodes.OK).json(updatedPost);
});

export const dislikePost = asyncHandler(async (req, res, next) => {
  const { id: userId } = req.user;
  const { id: postId } = req.params;

  const post = await Post.findById(postId);

  if (!post) {
    return next(
      new NotFoundError(`There is no post found with the given ID → ${postId}`),
    );
  }

  const isLiked = post.likes.some((id) => String(id) === userId);
  const isDisliked = post.dislikes.some((id) => String(id) === userId);

  let update = {};

  if (isLiked) {
    update = {
      $pull: { likes: userId },
      $addToSet: { dislikes: userId },
      $inc: {
        likeCount: -1,
        dislikeCount: 1,
      },
    };
  } else if (isDisliked) {
    update = {
      $pull: { dislikes: userId },
      $inc: { dislikeCount: -1 },
    };
  } else {
    update = {
      $addToSet: { dislikes: userId },
      $inc: { dislikeCount: 1 },
    };
  }

  const updatedPost = await Post.findByIdAndUpdate(postId, update, {
    new: true,
    runValidators: true,
  });

  return res.status(StatusCodes.OK).json(updatedPost);
});

export const deletePost = asyncHandler(async (req, res, next) => {
  const { id: postId } = req.params;
  const { id: userId, role } = req.user;

  const post = await Post.findById(postId);

  if (!post) {
    return next(
      new NotFoundError(`There is no post found with the given ID → ${postId}`),
    );
  }

  if (String(post.author) !== userId || role !== 'admin') {
    return next(
      new ForbiddenError(
        'You do not have permission to perform this operation',
      ),
    );
  }

  await Post.findByIdAndDelete(postId);

  return res.status(StatusCodes.NO_CONTENT).end();
});

export const getPostById = factory.getOneById(Post, 'post', 'comments');
export const getPostBySlug = factory.getOneBySlug(Post, 'post', 'comments');
export const createPost = factory.createOne(Post);
