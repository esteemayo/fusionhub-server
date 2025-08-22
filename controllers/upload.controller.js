import ImageKit from 'imagekit';
import dotenv from 'dotenv';
import { StatusCodes } from 'http-status-codes';

dotenv.config({ path: './config.env' });

const { IMAGEKIT_URL_ENDPOINT, IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY } =
  process.env;

const imagekit = new ImageKit({
  urlEndpoint: IMAGEKIT_URL_ENDPOINT,
  publicKey: IMAGEKIT_PUBLIC_KEY,
  privateKey: IMAGEKIT_PRIVATE_KEY,
});

export const uploadAuth = async (req, res, next) => {
  const authParams = imagekit.getAuthenticationParameters();
  return res.status(StatusCodes.OK).json(authParams);
};
