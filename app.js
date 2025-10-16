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

import uploadRoutes from './routes/upload.route.js';
import authRoutes from './routes/auth.route.js';
import commentRoutes from './routes/comment.route.js';
import muteRoutes from './routes/mute.route.js';
import contactRoutes from './routes/contact.route.js';
import postRoutes from './routes/post.route.js';
import categoryRoutes from './routes/category.route.js';
import userRoutes from './routes/users.route.js';
import newsletterRoutes from './routes/newsletter.route.js';
import replyRoutes from './routes/reply.route.js';
import adminDashboardRoutes from './routes/admin.dashboard.route.js';
import reportRoutes from './routes/report.route.js';

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

app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/mutes', muteRoutes);
app.use('/api/v1/contacts', contactRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/newsletter', newsletterRoutes);
app.use('/api/v1/replies', replyRoutes);
app.use('/api/v1/admin/dashboard', adminDashboardRoutes);
app.use('/api/v1/reports', reportRoutes);

app.all('*', (req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server`));
});

app.use(errorHandlerMiddleware);

export default app;
