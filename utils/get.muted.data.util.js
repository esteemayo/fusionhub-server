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

  const mutedUsers =
    user?.mutedUsers.map((user) => user.targetId.toString()) ?? [];

  const mutedComments =
    user?.mutedComments.map((comment) => comment.targetId.toString()) ?? [];

  const mutedReplies =
    user?.mutedReplies.map((reply) => reply.targetId.toString()) ?? [];

  return {
    mutedUsers,
    mutedComments,
    mutedReplies,
  };
};
