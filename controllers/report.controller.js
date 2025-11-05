import { StatusCodes } from 'http-status-codes';
import asyncHandler from 'express-async-handler';

import Report from '../models/report.model.js';
import Reply from '../models/reply.model.js';
import Comment from '../models/comment.model.js';

import { NotFoundError } from '../errors/not.found.error.js';
import { BadRequestError } from '../errors/bad.request.error.js';

export const getAdminReports = asyncHandler(async (req, res, next) => {
  const { status } = req.query;

  const filter = status ? { status } : {};

  const reports = await Report.find(filter);

  return res.status(StatusCodes.OK).json(reports);
});

export const getReport = asyncHandler(async (req, res, next) => {
  const { id: reportId } = req.params;

  const report = await Report.findById(reportId);

  if (!report) {
    return next(
      new NotFoundError(
        `There is no report found with the given ID → ${reportId}`,
      ),
    );
  }

  return res.status(StatusCodes.OK).json(report);
});

export const createReport = asyncHandler(async (req, res, next) => {
  const { id: userId, role } = req.user;
  const { targetType, targetId } = req.body;

  if (userId === targetId) {
    return next(new BadRequestError('You cannot report yourself'));
  }

  if (!['comment', 'reply'].includes(targetType)) {
    return next(new BadRequestError('Invalid target type'));
  }

  const targetModel = targetType === 'comment' ? Comment : Reply;

  const targetExists = await targetModel.findById(targetId);

  if (!targetExists) {
    return next(new NotFoundError(`${targetType} not found`));
  }

  const existingReport = await Report.findOne({
    reporter: userId,
    targetType,
    targetId,
  });

  if (existingReport) {
    return next(new BadRequestError('You already reported this content'));
  }

  if (!req.body.reporter) req.body.reporter = userId;

  const report = await Report.create({
    ...req.body,
  });

  return res.status(StatusCodes.CREATED).json(report);
});

export const updateReport = asyncHandler(async (req, res, next) => {
  const { id: reportId } = req.params;
  const { id: userId } = req.user;
  const { status, adminNote } = req.body;

  const report = await Report.findById(reportId);

  if (!report) {
    return next(
      new NotFoundError(
        `There is no report found with the given ID → ${reportId}`,
      ),
    );
  }

  report.status = status || 'reviewed';
  report.reviewedBy = userId;
  report.adminNote = adminNote || '';

  if (report.status === 'action_taken') {
    const targetModel = report.targetType === 'comment' ? Comment : Reply;

    const target = await targetModel.findById(report.targetId);

    if (!target) {
      return next(
        new NotFoundError(
          `There is no ${report.targetType} found with the given ID → ${report.targetId}`,
        ),
      );
    }

    target.isHidden = true;
    await target.save({ timestamps: false });
  }

  await report.save();

  return res.status(StatusCodes.OK).json(report);
});

export const deleteReport = asyncHandler(async (req, res, next) => {
  const { id: reportId } = req.params;

  const report = await Report.findByIdAndDelete(reportId);

  if (!report) {
    return next(
      new NotFoundError(
        `There is no report found with the given ID → ${reportId}`,
      ),
    );
  }

  return res.status(StatusCodes.NO_CONTENT).end();
});
