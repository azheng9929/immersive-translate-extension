export function normalizeVisibleText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeForCache(value: string): string {
  return normalizeVisibleText(value).toLowerCase();
}
