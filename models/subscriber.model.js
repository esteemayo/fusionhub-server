import crypto from 'crypto';
import mongoose from 'mongoose';

const { Schema } = mongoose;

const subscriberSchema = new Schema(
  {
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
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'unsubscribed'],
      default: 'pending',
    },
    confirmationToken: {
      type: String,
    },
    unsubscribeToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

subscriberSchema.methods.generateConfirmationToken = function () {
  const confirmToken = crypto
    .createHmac('sha256', process.env.CONFIRMATION_SECRET)
    .update(this.email + Date.now())
    .digest('hex');

  this.confirmationToken = confirmToken;

  return confirmToken;
};

subscriberSchema.methods.generateUnsubscribeToken = function () {
  const unsubscribeToken = crypto
    .createHmac('sha256', process.env.UNSUBSCRIBE_SECRET)
    .update(this.email + Date.now())
    .digest('hex');

  this.unsubscribeToken = unsubscribeToken;

  return unsubscribeToken;
};

const Subscriber =
  mongoose.models.Subscriber || mongoose.model('Subscriber', subscriberSchema);

export default Subscriber;
