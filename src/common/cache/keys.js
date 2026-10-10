export const cacheKeys = Object.freeze({
  profile: (userId) => `profile:${userId}`,
  me: (userId) => `me:${userId}`,
  feed: (userId, page, limit) => `feed:${userId}:${page}:${limit}`,
  explore: (userId, page, limit) => `explore:${userId}:${page}:${limit}`,
});
