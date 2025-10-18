/* eslint disable */

import User from '../models/user.model.js';

export const getMutedData = async (req) => {
  if (!req.user || !req.user.id) {
    return {
      mutedUsers: [],
      mutedComments: [],
      mutedReplies: [],
    };
  }

  const user = await User.findById(req.user.id).select(
    'mutedUsers mutedComments mutedReplies',
  );

  const mutedUsers = user?.mutedUsers ?? [];
  const mutedComments = user?.mutedComments ?? [];
  const mutedReplies = user?.mutedReplies ?? [];

  return {
    mutedUsers,
    mutedComments,
    mutedReplies,
  };
};
