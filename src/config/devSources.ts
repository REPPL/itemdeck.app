/**
 * Example collection configuration for MyPlausibleMe.
 *
 * Provides hard-coded references to example collections from the
 * REPPL/MyPlausibleMe repository. These are always available for
 * users to add as sources, regardless of environment.
 *
 * @see F-112: MyPlausibleMe Example Loading
 */

/**
 * Example collection configuration.
 */
export interface ExampleCollection {
  /** Unique identifier for this example */
  id: string;
  /** Display name */
  name: string;
  /** Collection folder name in MyPlausibleMe/data/examples/ */
  folder: string;
  /** Brief description */
  description: string;
  /** Item count (approximate) */
  itemCount?: number;
  /** Whether collection.json exists (verified collections) */
  hasCollection: boolean;
}

/**
 * Available example collections from MyPlausibleMe/data/examples/.
 *
 * These collections are available in the REPPL/MyPlausibleMe repository
 * under the data/examples/ directory. Only collections with hasCollection: true
 * have a collection.json file ready to use.
 */
export const EXAMPLE_COLLECTIONS: ExampleCollection[] = [
  {
    id: "example-books",
    name: "100 Greatest Books",
    folder: "books",
    description: "Classic and contemporary literature spanning centuries of storytelling",
    itemCount: 100,
    hasCollection: true,
  },
  {
    id: "example-games",
    name: "Video Games Collection",
    folder: "games/vc",
    description: "Modern video games across PC, PlayStation, Xbox, and Nintendo platforms",
    itemCount: 50,
    hasCollection: true,
  },
  {
    id: "example-movies",
    name: "100 Highest-Grossing Films",
    folder: "movies",
    description: "The 100 most successful films of all time by worldwide box office revenue",
    itemCount: 100,
    hasCollection: true,
  },
  {
    id: "example-songs",
    name: "100 Best-Selling Singles",
    folder: "songs",
    description: "The 100 best-selling music singles of all time",
    itemCount: 100,
    hasCollection: true,
  },
  {
    id: "example-tv",
    name: "TV Shows Collection",
    folder: "tv",
    description: "Television series from classic dramas to modern hits (1972-2024)",
    itemCount: 126,
    hasCollection: true,
  },
];

/**
 * Get example collections that are ready to use (have collection.json).
 */
export function getAvailableExamples(): ExampleCollection[] {
  return EXAMPLE_COLLECTIONS.filter((c) => c.hasCollection);
}

/**
 * Build the URL for an example collection.
 *
 * Example collections are stored in data/examples/ instead of data/collections/.
 *
 * @param folder - Collection folder name
 * @param username - GitHub username (defaults to REPPL)
 * @param branch - Git branch (defaults to main)
 * @returns CDN URL for the example collection
 */
export function buildExampleCollectionUrl(
  folder: string,
  username = "REPPL",
  branch = "main"
): string {
  return `https://cdn.jsdelivr.net/gh/${username}/MyPlausibleMe@${branch}/data/examples/${folder}`;
}

/**
 * Check if we're in development mode.
 *
 * Uses Vite's import.meta.env.DEV which is true during dev server
 * and false in production builds.
 */
export function isDevelopmentMode(): boolean {
  return import.meta.env.DEV;
}
