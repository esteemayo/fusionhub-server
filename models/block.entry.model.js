import mongoose from 'mongoose';

const { Schema, Types } = mongoose;

const blockEntrySchema = new Schema(
  {
    targetId: {
      type: Types.ObjectId,
      required: [true, 'A block entry must have a target ID'],
      ref: 'User',
    },
    reason: {
      type: String,
      trim: true,
      default: 'No reason provided',
      maxLength: [50, 'Reason must be less than or equal to 50 characters'],
    },
    blockedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

export default blockEntrySchema;
