/* eslint-disable */

import jwt from 'jsonwebtoken';
import { promisify } from 'util';

export const createSendToken = async (user, statusCode, req, res) => {
  const token = user.generateAuthToken();

  const decodedToken = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET,
  );

  res.cookie('authToken', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production' ? true : false,
  });

  const { password, role, ...rest } = user._doc;

  const details = {
    ...rest,
    tokenExpiration: decodedToken.exp,
  };

  return res.status(statusCode).json({
    details,
    role,
  });
};
