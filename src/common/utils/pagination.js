export function getPagination(query = {}, defaults = {}) {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const requestedLimit = Number.parseInt(query.limit ?? query.size, 10) || defaults.limit || 20;
  const maxLimit = defaults.maxLimit || 50;
  const limit = Math.min(Math.max(requestedLimit, 1), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}
