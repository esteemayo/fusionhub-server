import mongoose from 'mongoose';

const { Schema, Types } = mongoose;

const muteEntrySchema = new Schema(
  {
    targetId: {
      type: Types.ObjectId,
      required: [true, 'A mute entry must have a target ID'],
      refPath: 'targetType',
    },
    targetType: {
      type: String,
      enum: {
        values: ['User', 'Comment', 'Reply'],
        message: 'Target type must be either "User", "Comment", or "Reply"',
      },
      required: [true, 'A mute entry must have a target type'],
      set: (val) => {
        const formatted =
          val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
        return formatted;
      },
    },
    reason: {
      type: String,
      trim: true,
      default: 'No reason provided',
      maxLength: [50, 'Reason must be less than or equal to 50 characters'],
    },
    mutedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

export default muteEntrySchema;
