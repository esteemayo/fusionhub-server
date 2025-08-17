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

import uploadRoute from './routes/upload.route.js';
import authRoute from './routes/auth.route.js';
import commentRoute from './routes/comment.route.js';
import postRoute from './routes/post.route.js';
import contactRoute from './routes/contact.route.js';
import userRoute from './routes/users.route.js';
import categoryRoute from './routes/category.route.js';
import replyRoute from './routes/reply.route.js';
import newsletterRouter from './routes/newsletter.route.js';

import { NotFoundError } from './errors/not.found.error.js';
import { errorHandlerMiddleware } from './middlewares/error.handler.middleware.js';

dotenv.config({ path: './config.env' });

const app = express();

const devEnv = process.env.NODE_ENV !== 'production';
const { CLIENT_DEV_URL, CLIENT_PROD_URL } = process.env;

const origin = devEnv ? CLIENT_DEV_URL : CLIENT_PROD_URL;

app.set('trust proxy', 1);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept',
  );

  next();
});

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
  message: 'Too many requests from this IP, please try again in 15 minutes',
});

app.use('/api', limiter);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(cookieParser());

app.use(mongoSanitize());

app.use(hpp());

app.use(xss());

app.use(compression());

app.use('/api/v1/uploads', uploadRoute);
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/comments', commentRoute);
app.use('/api/v1/posts', postRoute);
app.use('/api/v1/contacts', contactRoute);
app.use('/api/v1/users', userRoute);
app.use('/api/v1/categories', categoryRoute);
app.use('/api/v1/replies', replyRoute);
app.use('/api/v1/newsletter', newsletterRouter);

app.all('*', (req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server`));
});

app.use(errorHandlerMiddleware);

export default app;
