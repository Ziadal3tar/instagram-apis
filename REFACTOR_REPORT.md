# Refactor / Performance Report

## What was reorganized

The original backend mixed application bootstrap, DB connection, Socket.IO events and REST routes inside `index.js`. Controllers also mixed validation, database access, upload handling and response shaping.

The refactor separates:

- `config` — environment/database configuration
- `database/models` — Mongoose schemas/indexes
- `middleware` — authentication, validation and global errors
- `modules/<feature>` — route/controller/service/validation per domain
- `common/cache` — cache implementation + keys
- `services` — Cloudinary, uploads and Multer
- `modules/socket` — realtime events
- `app.js` — Express composition
- `server.js` — runtime lifecycle

## Important bugs fixed

### Application/runtime

- Removed undefined `gg` and `posts.length` references that made `explore` fail.
- Fixed authentication error flow so invalid/expired JWTs return `401` instead of falling into a generic `500`.
- Replaced `err.cause` status handling with explicit HTTP status/error codes.
- Fixed validation middleware so it cannot call `next()` multiple times.
- Moved DB/server startup out of the Express composition layer.
- Fixed temporary upload files not being deleted after Cloudinary processing.

### Database/query problems

- Removed deep unrestricted `populate()` chains from profile/feed endpoints.
- Authentication now selects only fields needed for authorization.
- Feed/explore use aggregation projections and return counters instead of full likes/comments arrays.
- Comment responses are paginated for a single post/reel.
- Chat reads return only the last N messages instead of the complete chat document.
- Exact one-to-one chat matching checks for exactly two users.
- Added indexes for user relationships, post/reel/story timelines, tags, chats and notification lookups.
- Fixed schema typos such as `enums` -> `enum`.
- Fixed chat/story date defaults so a new value is generated per document/message.

### API/data-overfetching

The most expensive legacy responses were:

- `getUserData`: entire user graph
- profile: posts + reels + comments + nested owners
- like: full updated post/reel
- comment: full updated post/reel
- feed: full `likes` + full `comments` + nested post lists on the author

These are now reduced to focused resources and counters. The frontend can update a single item after like/save/comment without downloading the entire object again.

## Cache strategy

Redis is optional via `REDIS_URL`.

When Redis is unavailable, the same service falls back to an in-process TTL Map, so local development still works.

Cached resources:

- authenticated user summary
- personalized feed
- explore feed

Mutations invalidate affected cache prefixes/keys.

## API contract changes

Successful responses now follow:

```json
{
  "success": true,
  "message": "optional",
  "data": {}
}
```

Errors follow:

```json
{
  "success": false,
  "message": "Invalid token",
  "code": "INVALID_TOKEN"
}
```

This is intentionally a contract cleanup. Existing URLs are retained where practical, but some response bodies are smaller and more structured than the original implementation.

## Validation performed on the provided source

- Node syntax check for every JavaScript source file: passed.
- Static architecture smoke tests: passed.
- Secret `.env` file excluded from the rebuilt package.
- Legacy broken path/debug references scan: passed.
- HTTP smoke tests are included in `test/smoke.test.mjs`; they automatically run once dependencies are installed. They were skipped in this environment because npm packages were not available locally and external package installation timed out.

## Remaining scale consideration

Chat messages and notifications are still embedded arrays for compatibility with the current data model. For a large production workload, those should become dedicated collections with cursor pagination and compound indexes. The current refactor limits what is read and sent, but does not hide that modeling limitation.
