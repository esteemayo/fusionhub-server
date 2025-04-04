import Post from '../models/post.model.js';

export const increaseViews = async (req, res, next) => {
  const { id: postId, slug } = req.params;

  if (postId) {
    await Post.findByIdAndUpdate(postId, {
      $inc: { views: 1 },
    });
  } else {
    await Post.findOneAndUpdate(
      { slug },
      {
        $inc: { views: 1 },
      },
    );
  }

  next();
};
