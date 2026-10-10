# Instagram API Backend — Refactored

This version restructures the backend into feature modules, reduces database over-fetching, adds bounded pagination, improves authentication/error handling, adds cache support, and isolates Socket.IO from the HTTP bootstrap.

## Architecture

```text
src/
├── config/                 # environment + MongoDB
├── database/models/        # Mongoose models + indexes
├── common/                 # errors, cache, utilities, constants
├── middleware/             # auth, validation, global errors
├── services/               # Cloudinary, uploads, Multer
├── modules/
│   ├── auth/
│   ├── users/
│   ├── feed/
│   ├── posts/
│   ├── reels/
│   ├── stories/
│   ├── chats/
│   └── socket/
├── graphql/                # legacy GraphQL auth compatibility
├── app.js                  # Express composition only
└── server.js               # HTTP + DB + cache + Socket.IO bootstrap
```

## Install

```bash
npm install
cp .env.example .env
npm test
npm run dev
```

The original `.env` was intentionally removed from the deliverable. Put your real credentials in a local `.env` file.

## Cache

Set `REDIS_URL=redis://127.0.0.1:6379` to enable Redis. The backend contains a small Redis protocol client, so no extra Redis npm package is required. When Redis is unavailable, the same cache service falls back to process memory instead of preventing the API from starting.

Current cache targets:

- personalized feed: 10 seconds
- explore feed: 20 seconds
- current-user summary: 20 seconds
- cache invalidation after follow, save, post, reel, profile and notification mutations

## Performance changes

- Authentication no longer loads the complete user document on every request.
- Feed/explore responses return `likesCount`, `commentsCount`, and `viewerLiked` instead of full likes/comments arrays.
- Profile pages query posts/reels directly by `createdBy` instead of deeply populating the user's entire posts/reels graph.
- Chat reads are bounded with `$slice` and pair matching checks for exactly two users.
- MongoDB indexes were added for feed, search, relationships, stories, chats, tags and timestamps.
- Uploads are removed from disk in `finally` after Cloudinary processing.
- Multer has bounded file size/count limits.
- Global errors now return stable HTTP status codes instead of relying on `err.cause`.
- Pagination is clamped to safe maximums.

## API compatibility

Existing base groups remain available:

```text
POST /auth/signUp
POST /auth/logIn
POST /auth/loginWithGoogle
POST /auth/loginWithFB
POST /auth/logInWithFbOrGoogle

POST /user/getUserData
POST /user/getProfilesData
POST /user/searchUser
POST /user/changeUserImage
GET  /user/visited/:_id
GET  /user/follow/:_id
POST /user/newCollection
POST /user/savePost
POST /user/addToCollection
GET  /user/getPosts
GET  /user/getSaved
GET  /user/allNotificationSeen
POST /user/bio
DELETE /user/deleteCollection/:id

POST /posts/addPost
POST /posts/like
POST /posts/addComment
POST /posts/getPostById
GET  /posts/explore

POST /reels/addReel
GET  /reels/getAllReels

POST /stories/addStory

POST /chats/sendMessage
POST /chats/getChat
GET  /feed/explore
```

The response contract is intentionally more consistent than the legacy project: successful responses use `success: true` and place the resource under `data`, while validation/auth/server errors use `success: false`, `message`, and a machine-readable `code`.

## Important data-model note

The current Chat model still stores messages as an embedded array for compatibility. For a large production social network, the next scale step is to move messages and notifications into dedicated collections with compound indexes and cursor pagination. The current refactor bounds the read payloads but does not pretend an ever-growing embedded array is infinitely scalable.
