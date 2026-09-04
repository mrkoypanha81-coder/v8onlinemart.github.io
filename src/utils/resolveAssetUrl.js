/**
 * Safely resolves relative or absolute static asset paths against Vite's configured base URL.
 * Handles './image prodacts/...', '/image prodacts/...', external URLs, and data URLs.
 * Automatically strips duplicate base paths if already present.
 */
export const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80';

export const resolveAssetUrl = (url) => {
  if (!url || typeof url !== 'string') return DEFAULT_FALLBACK_IMAGE;
  
  const trimmed = url.trim();
  if (!trimmed) return DEFAULT_FALLBACK_IMAGE;

  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return trimmed;
  }

  // Get base URL from Vite environment (e.g. '/v8onlinemart.github.io/' or '/')
  const base = import.meta.env.BASE_URL || '/';
  const prefix = base.endsWith('/') ? base : `${base}/`;

  // Clean path: strip leading base if already prepended
  let cleanPath = trimmed;
  if (base !== '/' && cleanPath.startsWith(base)) {
    cleanPath = cleanPath.slice(base.length);
  }

  // Clean leading slashes and dots
  cleanPath = cleanPath.replace(/^\.?\/+/, '');

  return `${prefix}${cleanPath}`;
};

export const handleImageError = (e) => {
  e.target.onerror = null;
  e.target.src = DEFAULT_FALLBACK_IMAGE;
};
