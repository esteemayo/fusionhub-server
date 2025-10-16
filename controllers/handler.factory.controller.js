/* eslint-disable */

import { StatusCodes } from 'http-status-codes';
import asyncHandler from 'express-async-handler';

import User from '../models/user.model.js';

import { APIFeatures } from '../utils/api.features.js';
import { NotFoundError } from '../errors/not.found.error.js';

export const getAll = (Model, popOptions) =>
  asyncHandler(async (req, res, next) => {
    const { id: userId } = req.user;

    const user = await User.findById(userId).select(
      'mutedComments, mutedReplies, mutedUsers',
    );

    let filter = {};

    if (req.params.postId)
      filter = {
        post: req.params.postId,
        _id: { $nin: user.mutedComments },
        user: { $nin: user.mutedUsers },
        isHidden: false,
      };

    if (req.params.commentId)
      filter = {
        comment: req.params.commentId,
        _id: { $nin: user.mutedReplies },
        user: { $nin: user.mutedUsers },
        isHidden: false,
      };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    let query = features.query;

    if (popOptions) query.populate(popOptions);

    const docs = await query;

    return res.status(StatusCodes.OK).json(docs);
  });

export const getOneById = (Model, label, popOptions) =>
  asyncHandler(async (req, res, next) => {
    const { id: docId } = req.params;

    let query = Model.findById(docId);
    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (!doc) {
      return next(
        new NotFoundError(
          `There is no ${label} found with the given ID → ${docId}`,
        ),
      );
    }

    return res.status(StatusCodes.OK).json(doc);
  });

export const getOneBySlug = (Model, label, popOptions) =>
  asyncHandler(async (req, res, next) => {
    const { slug } = req.params;

    let query = Model.findOne({ slug });
    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (!doc) {
      return next(
        new NotFoundError(
          `There is no ${label} found with the given SLUG → ${slug}`,
        ),
      );
    }

    return res.status(StatusCodes.OK).json(doc);
  });

export const createOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    if (!req.body.post) req.body.post = req.params.postId;
    if (!req.body.author) req.body.author = req.user.id;
    if (!req.body.comment) req.body.comment = req.params.commentId;

    const doc = await Model.create({ ...req.body });

    if (doc) {
      return res.status(StatusCodes.CREATED).json(doc);
    }
  });

export const updateOne = (Model, label) =>
  asyncHandler(async (req, res, next) => {
    const { id: docId } = req.params;

    const updatedDoc = await Model.findByIdAndUpdate(
      docId,
      { $set: { ...req.body } },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedDoc) {
      return next(
        new NotFoundError(
          `There is no ${label} found with the given ID → ${docId}`,
        ),
      );
    }

    return res.status(StatusCodes.OK).json(updatedDoc);
  });

export const deleteOne = (Model, label) =>
  asyncHandler(async (req, res, next) => {
    const { id: docId } = req.params;

    const doc = await Model.findByIdAndDelete(docId);

    if (!doc) {
      return next(
        new NotFoundError(
          `There is no ${label} found with the given ID → ${docId}`,
        ),
      );
    }

    return res.status(StatusCodes.NO_CONTENT).end();
  });
