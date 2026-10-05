const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Prefix a site-relative path with the configured base, e.g. "images/a.webp" -> "/images/a.webp" (or "/<base>/images/a.webp" if a base is set). */
export const withBase = (path = ''): string => `${base}/${path.replace(/^\//, '')}`;

/** Absolute URL for a site-relative path (canonical, og:image, JSON-LD). */
export const absoluteUrl = (path: string, site: URL | undefined): string =>
  new URL(withBase(path), site).href;
