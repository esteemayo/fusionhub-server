import mongoose from 'mongoose';

const { Schema } = mongoose;

const contactSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      minLength: [6, 'Your name cannot be less than 6 characters long'],
      maxLength: [50, 'Your name cannot be more than 50 characters long'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email address'],
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
    phone: {
      type: String,
    },
    subject: {
      type: String,
      required: [true, 'Please the subject cannot be empty'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Please the message field cannot be empty'],
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Contact =
  mongoose.models.Contact || mongoose.model('Contact', contactSchema);

export default Contact;
