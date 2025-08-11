/* eslint-disable */

import crypto from 'crypto';
import dotenv from 'dotenv';
import mailchimp from '@mailchimp/mailchimp_marketing';

dotenv.config({ path: './config.env' });

mailchimp.setConfig({
  apiKey: process.env.MAIL_CHIMP_API_KEY,
  server: process.env.MAIL_CHIMP_SERVER_PREFIX,
});

export const addToMailchimp = async (email) => {
  try {
    const res = await mailchimp.lists.addListMember(
      process.env.MAIL_CHIMP_AUDIENCE_ID,
      {
        email_address: email,
        status: 'subscribed',
      },
    );

    return res;
  } catch (err) {
    if (err.response && err.response.body.title === 'Member Exists') {
      return { alreadySubscribed: true };
    }

    throw new Error('Email already subscribed');
  }
};

export const removeFromMailchimp = async (email) => {
  try {
    const hashedEmail = crypto
      .createHash('md5')
      .update(email.toLowerCase())
      .digest('hex');

    const res = await mailchimp.lists.updateListMember(
      process.env.MAIL_CHIMP_AUDIENCE_ID,
      hashedEmail,
      { status: 'unsubscribed' },
    );

    return res;
  } catch (err) {
    if (err.response && err.response.body.title === 'Member Not Found') {
      return { alreadyUnsubscribed: true };
    }

    throw new Error('Error unsubscribing from Mailchimp');
  }
};
