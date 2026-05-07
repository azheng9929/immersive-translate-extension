const SAFE_HREF_SCHEMES = new Set(["http", "https", "mailto", "tel", "ftp"]);
const URL_SCHEME_PATTERN = /^([a-z][a-z0-9+.-]*):/i;
const URL_CONTROL_OR_SPACE_PATTERN = /[\u0000-\u0020\u007f]+/g;

export function isSafeHrefAttribute(href: string): boolean {
  const normalized = href.trim().replace(URL_CONTROL_OR_SPACE_PATTERN, "");
  if (!normalized) return false;

  const scheme = URL_SCHEME_PATTERN.exec(normalized)?.[1]?.toLowerCase();
  return !scheme || SAFE_HREF_SCHEMES.has(scheme);
}
