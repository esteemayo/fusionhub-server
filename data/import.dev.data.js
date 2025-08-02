/* eslint-disable */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import 'colors';

import Reply from '../models/reply.model.js';
import Post from '../models/post.model.js';
import Comment from '../models/comment.model.js';
import User from '../models/user.model.js';
import Category from '../models/category.model.js';

import { connectDB } from '../config/db.config.js';

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

const importData = async () => {
  try {
    console.log('👌✌👌 Loading data...'.cyan.bold);

    await Reply.create(replies);
    await Post.create(posts);
    await Comment.create(comments);
    await User.create(users, { validateBeforeSave: false });
    await Category.create(categories);

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

    await Reply.deleteMany();
    await Post.deleteMany();
    await Comment.deleteMany();
    await User.deleteMany();
    await Category.deleteMany();

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
