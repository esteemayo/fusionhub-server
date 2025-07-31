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
    confirmed: {
      type: String,
    },
    confirmationToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

subscriberSchema.methods.generateConfirmationToken = function () {
  const confirmToken = crypto.randomBytes(20).toString('hex');

  this.confirmationToken = crypto
    .createHash('sha256')
    .update(confirmToken)
    .digest('hex');

  return confirmToken;
};

const Subscriber =
  mongoose.models.Subscriber || mongoose.model('Subscriber', subscriberSchema);

export default Subscriber;
