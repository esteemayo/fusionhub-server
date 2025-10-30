import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import muteEntrySchema from './mute.entry.model.js';
import blockEntrySchema from './block.entry.model.js';

const { Types, Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      minLength: [6, 'Your name cannot be less than 6 characters long'],
      maxLength: [50, 'Your name cannot be more than 50 characters long'],
    },
    username: {
      type: String,
      required: [true, 'Please provide your username'],
      unique: true,
      trim: true,
      validate: {
        validator: function (val) {
          return /^[a-zA-Z0-9_]{3,15}$/.test(val);
        },
        message: 'Username cannot contain special characters',
      },
    },
    email: {
      type: String,
      required: [true, 'Please provide your email address'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (val) {
          const emailRegex =
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\0-9]+\.)+[a-zA-Z]{2,}))$/;

          return emailRegex.test(val);
        },
        message: 'Please enter a valid email address',
      },
    },
    password: {
      type: String,
      required: function () {
        return !this.fromGoogle || !this.providerId;
      },
      minLength: [8, 'Password must be at least 8 characters long'],
      maxLength: [32, 'Password cannot exceed 32 characters'],
      validate: {
        validator: function (val) {
          const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
          return passwordRegex.test(val);
        },
        message:
          'Password must contain at least one lowercase letter, one uppercase letter, one number, one special character, and at least 8 characters long',
      },
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: function () {
        return !this.fromGoogle || !this.providerId;
      },
      validate: {
        validator: function (val) {
          return val === this.password;
        },
        message: 'Passwords do not match',
      },
    },
    phone: {
      type: String,
    },
    dateOfBirth: {
      type: String,
    },
    country: {
      type: String,
      required: function () {
        return !this.fromGoogle || !this.providerId;
      },
    },
    bio: {
      type: String,
      required: function () {
        return !this.fromGoogle || !this.providerId;
      },
    },
    about: {
      type: String,
    },
    image: {
      type: String,
    },
    banner: {
      type: String,
    },
    savedPosts: [
      {
        type: Types.ObjectId,
        ref: 'Post',
        default: [],
      },
    ],
    mutedUsers: [muteEntrySchema],
    mutedComments: [muteEntrySchema],
    mutedReplies: [muteEntrySchema],
    blockedUsers: [blockEntrySchema],
    fromGoogle: {
      type: Boolean,
      default: false,
    },
    providerId: {
      type: String,
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'user'],
        message: 'Role is either: admin or user',
      },
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    passwordChangedAt: {
      type: Date,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ _id: 1, savedPosts: -1 }, { unique: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ isActive: { $ne: false } });
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { id: this._id, email: this.email },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    },
  );

  return token;
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

userSchema.methods.changedPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.statics.getUserStats = async function () {
  const now = new Date();
  const lastYear = new Date(now.setFullYear(now.getFullYear() - 1));
  const prevYear = new Date(now.setFullYear(lastYear.getFullYear() - 1));

  const stats = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: prevYear },
      },
    },
    {
      $project: {
        month: { $month: '$createdAt' },
      },
    },
    {
      $group: {
        _id: '$month',
        total: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  return stats;
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
