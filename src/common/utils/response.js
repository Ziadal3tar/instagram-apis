export function sendSuccess(res, { data, message, status = 200, meta } = {}) {
  return res.status(status).json({
    success: true,
    ...(message ? { message } : {}),
    ...(data !== undefined ? { data } : {}),
    ...(meta ? { meta } : {}),
  });
}

export function sendError(res, { message = 'Request failed', status = 400, code = 'BAD_REQUEST', details } = {}) {
  return res.status(status).json({
    success: false,
    message,
    code,
    ...(details ? { details } : {}),
  });
}
