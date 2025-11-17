/* eslint-disable */

import mongoose from 'mongoose';

const { Types, Schema } = mongoose;

const VALID_REASONS = [
  'Spam or misleading',
  'Harassment or bullying',
  'Hate speech or discrimination',
  'Inappropriate or sexual content',
  'Other',
];

const reportSchema = new Schema(
  {
    reporter: {
      type: Types.ObjectId,
      ref: 'User',
      required: [true, 'A report must belong to a reporter'],
    },
    targetType: {
      type: String,
      enum: {
        values: ['Comment', 'Reply', 'User'],
        message: 'Target type must be either "Comment", "Reply", or "User"',
      },
      required: [true, 'A report must have a target type'],
    },
    targetId: {
      type: Types.ObjectId,
      required: [true, 'A report must have a target ID'],
      refPath: 'targetType',
    },
    reason: {
      type: String,
      enum: {
        values: VALID_REASONS,
        message:
          'Reason must be either "Spam or misleading" or "Harassment or bullying" or "Hate speech or discrimination" or "Inappropriate or sexual content" or "Other"',
      },
      required: [true, 'A report must have a reason'],
    },
    customReason: {
      type: String,
      trim: true,
      maxLength: [
        200,
        'A custom reason must be less than or equal to 200 characters',
      ],
      validate: {
        validator: function (val) {
          if (this.reason === 'Other') {
            return !!val && val.trim().length > 0;
          }
          return !val;
        },
        message:
          'A custom reason is required when reason is "Other", and must b empty otherwise',
      },
    },
    details: {
      type: String,
      maxLength: [
        500,
        'A report details must be less than or equal to 500 characters',
      ],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'reviewed', 'action_taken'],
        message:
          'Status must be either "pending", "reviewed", or "action_taken"',
      },
      default: 'pending',
    },
    reviewedBy: {
      type: Types.ObjectId,
      ref: 'User',
    },
    adminNote: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

reportSchema.index(
  { reporter: 1, targetId: 1, targetType: 1 },
  { unique: true },
);

reportSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'reporter',
    select: 'username email',
  });

  this.populate({
    path: 'reviewedBy',
    select: 'username',
  });

  // this.populate({
  //   path: 'targetId',
  // });

  next();
});

const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);

export default Report;
