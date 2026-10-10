const dataSources = ['body', 'params', 'query', 'headers'];

export const validation = (schema) => (req, res, next) => {
  const details = [];

  for (const source of dataSources) {
    if (!schema?.[source]) continue;
    const result = schema[source].validate(req[source], { abortEarly: false, stripUnknown: true });
    if (result.error) details.push(...result.error.details);
    else req[source] = result.value;
  }

  if (details.length) {
    return res.status(400).json({ success: false, message: 'Validation error', details });
  }

  return next();
};
