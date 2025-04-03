/* eslint-disable */

export const createSendGoogleToken = (user, statusCode, req, res) => {
  const token = user.generateAuthToken();

  res.cookie('authToken', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    sameSite: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  const { role, ...rest } = user._doc;

  const details = {
    ...rest,
  };

  return res.status(statusCode).json({
    details,
    role,
  });
};
