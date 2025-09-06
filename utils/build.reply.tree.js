export const buildReplyTree = (replies, parentId = null) => {
  return replies
    .filter((reply) => String(reply.parentReply) === String(parentId))
    .map((reply) => ({
      ...reply,
      replies: buildReplyTree(replies, reply._id),
    }));
};
