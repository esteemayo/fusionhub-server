/* eslint disable */

import User from '../models/user.model.js';

export const getMutualBlockedUsers = async (req) => {
  if (!req.user || !req.user.id) {
    return {
      blockedUsers: [],
    };
  }

  const user = await User.findById(req.user.id).select('blockedUsers');

  const iBlocked = user?.blockedUsers.map((user) => user.targetId);

  const blockedMe = await User.find({
    'blockedUsers.targetId': req.user.id,
  }).select('_id');

  const theyBlockedMe = blockedMe?.map((user) => user._id);

  const blockedUsers = [...new Set([...iBlocked, ...theyBlockedMe])];

  return {
    blockedUsers,
  };
};
