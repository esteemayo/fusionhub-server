/* eslint-disable */

import helmet from 'helmet';
import hpp from 'hpp';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoSanitize from 'express-mongo-sanitize';

import 'colors';

import commentRoute from './routes/comment.route.js';
import authRoute from './routes/auth.route.js';
import categoryRoute from './routes/category.route.js';
import postRoute from './routes/post.route.js';
import replyCommentRoute from './routes/reply.comment.route.js';
import userRoute from './routes/users.route.js';

import { NotFoundError } from './errors/not.found.error.js';
import errorHandler from './middlewares/error.handler.middleware.js';

dotenv.config({ path: './config.env' });

const app = express();

const devEnv = process.env.NODE_ENV !== 'production';
const { DEV_URL, PROD_URL } = process.env;

const origin = devEnv ? DEV_URL : PROD_URL;

app.set('trust proxy', 1);

app.use(cors({ origin, credentials: true }));
app.options('*', cors());

app.use(helmet());

if (!process.env.JWT_SECRET) {
  process.exit(1);
}

if (app.get('env') === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  max: 2500,
  windowMs: 15 * 60 * 1000,
  message: 'Too many request from this IP, Please try again in 15 minutes',
});

app.use('/api', limiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(cookieParser());

app.use(mongoSanitize());

app.use(hpp());

app.use(xss());

app.use(compression());

app.use('/api/v1/categories', categoryRoute);
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/comments', commentRoute);
app.use('/api/v1/users', userRoute);
app.use('/api/v1/reply-comments', replyCommentRoute);
app.use('/api/v1/posts', postRoute);

app.all('*', (req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server`));
});

app.use(errorHandler);

export default app;
