/**
 * Base path helpers.
 *
 * The app is served from a subpath of the origin ("/demo/") while the
 * marketing landing page owns "/". Vite injects the configured base as
 * import.meta.env.BASE_URL at build time, but tooling such as vitest
 * defaults it to "/", so these helpers are robust to both values.
 *
 * Use withBase() when building URLs for app-served assets (data, themes,
 * icons) and stripBase() before matching route patterns against
 * window.location.pathname.
 */

/**
 * Normalize a base so it always has leading and trailing slashes.
 */
function normalizeBase(base: string): string {
  let result = base || "/";
  if (!result.startsWith("/")) {
    result = `/${result}`;
  }
  if (!result.endsWith("/")) {
    result = `${result}/`;
  }
  return result;
}

/**
 * Get the app's base path with leading and trailing slashes.
 *
 * @returns "/" at the origin root, or e.g. "/demo/" under a subpath
 */
export function getBasePath(): string {
  return normalizeBase(import.meta.env.BASE_URL);
}

/**
 * Prefix a root-absolute app path with the base path.
 *
 * @param path - Root-absolute path (e.g. "/themes/")
 * @param base - Base path (defaults to the configured base)
 * @returns Path served under the base (e.g. "/demo/themes/")
 *
 * @example
 * withBase("/themes/") // "/demo/themes/" (or "/themes/" at root)
 */
export function withBase(path: string, base: string = getBasePath()): string {
  const normalizedBase = normalizeBase(base);
  const relative = path.startsWith("/") ? path.slice(1) : path;
  return `${normalizedBase}${relative}`;
}

/**
 * Strip the base path prefix from a pathname.
 *
 * Pathnames that do not start with the base are returned unchanged, so
 * the function is safe to call at the origin root and under a subpath.
 *
 * @param pathname - Pathname from window.location (e.g. "/demo/gh/USER")
 * @param base - Base path (defaults to the configured base)
 * @returns Root-absolute pathname (e.g. "/gh/USER")
 *
 * @example
 * stripBase("/demo/gh/REPPL/c/my_games") // "/gh/REPPL/c/my_games"
 */
export function stripBase(
  pathname: string,
  base: string = getBasePath()
): string {
  const normalizedBase = normalizeBase(base);
  if (normalizedBase === "/") {
    return pathname;
  }
  if (
    pathname === normalizedBase ||
    `${pathname}/` === normalizedBase
  ) {
    return "/";
  }
  if (pathname.startsWith(normalizedBase)) {
    return `/${pathname.slice(normalizedBase.length)}`;
  }
  return pathname;
}
