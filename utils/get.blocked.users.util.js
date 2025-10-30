/* eslint disable */

import User from '../models/user.model.js';

export const getBlockedUsers = async (req) => {
  if (!req.user || !req.user.id) {
    return {
      blockedUsers: [],
    };
  }

  const user = await User.findById(req.user.id).select('blockedUsers');

  const blockedUsers = (user.blockedUsers ?? []).map((user) =>
    user.targetId.toString(),
  );

  return {
    blockedUsers,
  };
};
