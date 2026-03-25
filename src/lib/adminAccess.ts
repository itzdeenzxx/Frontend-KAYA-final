export const parseAdminIds = (rawValue: string | undefined): Set<string> => {
  if (!rawValue) {
    return new Set();
  }

  // Accept comma, semicolon, or newline separated values from env configuration.
  const normalized = rawValue.replace(/[\r\n]+/g, ',').replace(/;/g, ',');
  const ids = normalized
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  return new Set(ids);
};

export const isLineUserAdmin = (userId: string | undefined, rawValue: string | undefined): boolean => {
  if (!userId) {
    return false;
  }
  return parseAdminIds(rawValue).has(userId);
};