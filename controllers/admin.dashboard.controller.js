import { StatusCodes } from 'http-status-codes';
import asyncHandler from 'express-async-handler';

import Report from '../models/report.model.js';
import Reply from '../models/reply.model.js';
import Comment from '../models/comment.model.js';

export const getReportStats = asyncHandler(async (req, res, next) => {
  const totalReportsPromise = Report.countDocuments();
  const pendingPromise = Report.countDocuments({ status: 'pending' });
  const reviewedPromise = Report.countDocuments({ status: 'reviewed' });
  const actionTakenPromise = Report.countDocuments({ status: 'action_taken' });

  const [totalReports, pending, reviewed, actionTaken] = await Promise.all([
    totalReportsPromise,
    pendingPromise,
    reviewedPromise,
    actionTakenPromise,
  ]);

  const topReporters = await Report.aggregate([
    {
      $group: {
        _id: '$reporter',
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        count: -1,
      },
    },
    {
      $limit: 5,
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: '$user',
    },
    {
      $project: {
        username: '$user.username',
        count: 1,
      },
    },
  ]);

  const mostReportedTargets = await Report.aggregate([
    {
      $group: {
        _id: '$targetId',
        count: { $sum: 1 },
        type: {
          $first: '$targetType',
        },
      },
    },
    {
      $sort: {
        count: -1,
      },
    },
    {
      $limit: 5,
    },
  ]);

  const targetWithDetails = await Promise.all(
    mostReportedTargets.map(async (target) => {
      const model = target.type === 'comment' ? Comment : Reply;

      const content = await model
        .findById(target._id)
        .select('content isHidden');

      return {
        _id: target._id,
        type: target.type,
        count: target.count,
        content: content ? content.content : '[deleted]',
        isHidden: content ? content.isHidden : true,
      };
    }),
  );

  return res.status(StatusCodes.OK).json({
    summary: {
      totalReports,
      pending,
      reviewed,
      actionTaken,
    },
    topReporters,
    mostReported: targetWithDetails,
  });
});
