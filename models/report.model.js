import mongoose from 'mongoose';

const { Types, Schema } = mongoose;

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
        values: ['comment', 'reply'],
        message: 'Target type must be either "comment" or "reply"',
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
      maxLength: [
        500,
        'A report reason must be less than or equal to 500 characters',
      ],
      required: [true, 'A report must have a reason'],
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
