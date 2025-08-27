/* eslint-disable */

import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

import 'colors';

import Comment from '../models/comment.model.js';
import Post from '../models/post.model.js';
import Contact from '../models/contact.model.js';
import User from '../models/user.model.js';
import Category from '../models/category.model.js';
import Reply from '../models/reply.model.js';
import Subscriber from '../models/subscriber.model.js';

import { connectDB } from '../config/db.config.js';

dotenv.config({ path: './config.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();

const posts = JSON.parse(fs.readFileSync(`${__dirname}/posts.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const categories = JSON.parse(
  fs.readFileSync(`${__dirname}/categories.json`, 'utf-8'),
);
const comments = JSON.parse(
  fs.readFileSync(`${__dirname}/comments.json`, 'utf-8'),
);
const replies = JSON.parse(
  fs.readFileSync(`${__dirname}/replies.json`, 'utf-8'),
);
const contacts = JSON.parse(
  fs.readFileSync(`${__dirname}/contacts.json`, 'utf-8'),
);
const subscribers = JSON.parse(
  fs.readFileSync(`${__dirname}/subscribers.json`, 'utf-8'),
);

const importData = async () => {
  try {
    console.log('👌✌👌 Loading data...'.cyan.bold);

    await Comment.create(comments);
    await Post.create(posts);
    await Contact.create(contacts);
    await Reply.create(replies);
    await Subscriber.create(subscribers);
    await Category.create(categories);
    await User.create(users, { validateBeforeSave: false });

    console.log(
      '👍👍👍👍👍👍👍👍 Data successfully loaded! 👍👍👍👍👍👍👍👍'.green.bold,
    );
    process.exit();
  } catch (err) {
    console.log(err);
    process.exit();
  }
};

const deleteData = async () => {
  try {
    console.log('😢😢 Goodbye Data...'.red.bold);

    await Contact.deleteMany();
    await Post.deleteMany();
    await Comment.deleteMany();
    await User.deleteMany();
    await Category.deleteMany();
    await Reply.deleteMany();
    await Subscriber.deleteMany();

    console.log(
      'Data successfully deleted! To load sample data, run\n\n\t npm run sample\n\n'
        .blue.bold,
    );
    process.exit();
  } catch (err) {
    console.log(err);
    process.exit();
  }
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
