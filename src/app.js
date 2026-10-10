import express from 'express';
import cors from 'cors';
import { createHandler } from 'graphql-http/lib/use/express';
import { createRequire } from 'node:module';

import authRouter from './modules/auth/auth.routes.js';
import userRouter from './modules/users/user.routes.js';
import postRouter from './modules/posts/post.routes.js';
import reelRouter from './modules/reels/reel.routes.js';
import storyRouter from './modules/stories/story.routes.js';
import chatRouter from './modules/chats/chat.routes.js';
import feedRouter from './modules/feed/feed.routes.js';

import { authSchema } from './graphql/auth.schema.js';
import { globalError, notFound } from './middleware/error.js';

const require = createRequire(import.meta.url);

// Support both CommonJS export styles
const playgroundModule = require('graphql-playground-middleware-express');

const expressPlayground =
  typeof playgroundModule === 'function'
    ? playgroundModule
    : playgroundModule?.default ?? playgroundModule?.express;

const app = express();

app.disable('x-powered-by');
app.set('json spaces', 0);

const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((value) => value.trim());

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error('CORS origin not allowed'));
    },
    credentials: true,
  })
);

app.use(
  express.json({
    limit: process.env.JSON_BODY_LIMIT || '1mb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.URLENCODED_BODY_LIMIT || '1mb',
  })
);

// Health checks
app.get('/ping', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'pong',
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
  });
});

// REST APIs
app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/posts', postRouter);
app.use('/reels', reelRouter);
app.use('/stories', storyRouter);
app.use('/chats', chatRouter);
app.use('/feed', feedRouter);

// GraphQL
app.use(
  '/graphql',
  createHandler({
    schema: authSchema,
    graphiql: process.env.NODE_ENV === 'development',
  })
);

// GraphQL Playground
if (typeof expressPlayground === 'function') {
  app.get(
    '/playground',
    expressPlayground({
      endpoint: '/graphql',
    })
  );
} else {
  console.warn(
    '[GraphQL] graphql-playground-middleware-express could not be initialized.'
  );
}

// Errors
app.use(notFound);
app.use(globalError);

export default app;