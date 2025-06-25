/* eslint-disable */

import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  let smtpTransporter;

  if (process.env.NODE_ENV === 'development') {
    smtpTransporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: false,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  } else if (process.env.NODE_ENV === 'production') {
    smtpTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  const mailOptions = {
    from: `Fusion Hub Team <${process.env.MAIL_FROM}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  return await smtpTransporter.sendMail(mailOptions);
};
