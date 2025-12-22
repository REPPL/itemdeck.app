/**
 * Migration script for converting legacy collection format to v1 schema.
 *
 * Usage: npx ts-node scripts/migrate-collection.ts retro-games
 */

import * as fs from "fs";
import * as path from "path";

interface LegacyItem {
  id: string;
  title: string;
  year?: string;
  summary?: string;
  detailUrl?: string;
  imageUrl?: string;
  imageUrls?: string[];
  imageAttribution?: string;
  metadata?: {
    category?: string;
    rank?: string;
    device?: string;
  };
}

interface LegacyCategory {
  id: string;
  title: string;
  year?: string;
  summary?: string;
  detailUrl?: string;
  logoUrl?: string;
}

interface V1Image {
  url: string;
  type?: string;
  alt?: string;
  attribution?: {
    source?: string;
    author?: string;
    licence?: string;
    url?: string;
  };
}

interface V1Game {
  id: string;
  title: string;
  platform: string;
  rank: number;
  year?: number;
  summary?: string;
  detailUrl?: string;
  images?: V1Image[];
}

interface V1Platform {
  id: string;
  title: string;
  year?: number;
  summary?: string;
  detailUrl?: string;
}

/**
 * Parse attribution string into structured object.
 */
function parseAttribution(
  attribution: string | undefined
): V1Image["attribution"] | undefined {
  if (!attribution) {
    return undefined;
  }

  // Pattern: "Image from Wikimedia Commons. File:Example.jpg"
  const wikiMatch = attribution.match(
    /Image[s]? from (Wikimedia Commons)/i
  );

  if (wikiMatch) {
    const fileMatch = attribution.match(/File:([^.]+\.[a-zA-Z]+)/);

    return {
      source: "Wikimedia Commons",
      licence: "Fair use",
      url: fileMatch
        ? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(
            fileMatch[1]
          )}`
        : undefined,
    };
  }

  return {
    source: attribution,
  };
}

/**
 * Convert legacy item to v1 game entity.
 */
function convertItem(item: LegacyItem): V1Game {
  // Build images array
  const images: V1Image[] = [];

  if (item.imageUrls && item.imageUrls.length > 0) {
    // Multiple images
    item.imageUrls.forEach((url, index) => {
      images.push({
        url,
        type: index === 0 ? "cover" : "screenshot",
        attribution: index === 0 ? parseAttribution(item.imageAttribution) : undefined,
      });
    });
  } else if (item.imageUrl) {
    // Single image
    images.push({
      url: item.imageUrl,
      type: "cover",
      attribution: parseAttribution(item.imageAttribution),
    });
  }

  const game: V1Game = {
    id: item.id,
    title: item.title,
    platform: item.metadata?.category?.toLowerCase() ?? "unknown",
    rank: parseInt(item.metadata?.rank ?? "0", 10),
  };

  if (item.year) {
    game.year = parseInt(item.year, 10);
  }

  if (item.summary) {
    game.summary = item.summary;
  }

  if (item.detailUrl) {
    game.detailUrl = item.detailUrl;
  }

  if (images.length > 0) {
    game.images = images;
  }

  return game;
}

/**
 * Convert legacy category to v1 platform entity.
 */
function convertCategory(category: LegacyCategory): V1Platform {
  const platform: V1Platform = {
    id: category.id.toLowerCase(),
    title: category.title,
  };

  if (category.year) {
    platform.year = parseInt(category.year, 10);
  }

  if (category.summary) {
    platform.summary = category.summary;
  }

  if (category.detailUrl) {
    platform.detailUrl = category.detailUrl;
  }

  return platform;
}

/**
 * Main migration function.
 */
async function migrate(collectionId: string): Promise<void> {
  const basePath = path.join(
    process.cwd(),
    "public/data/collections",
    collectionId
  );

  // Read legacy files
  const itemsPath = path.join(basePath, "items.json");
  const categoriesPath = path.join(basePath, "categories.json");

  if (!fs.existsSync(itemsPath)) {
    console.error(`Items file not found: ${itemsPath}`);
    process.exit(1);
  }

  if (!fs.existsSync(categoriesPath)) {
    console.error(`Categories file not found: ${categoriesPath}`);
    process.exit(1);
  }

  const items: LegacyItem[] = JSON.parse(fs.readFileSync(itemsPath, "utf-8"));
  const categories: LegacyCategory[] = JSON.parse(
    fs.readFileSync(categoriesPath, "utf-8")
  );

  console.log(`Converting ${items.length} items and ${categories.length} categories...`);

  // Convert entities
  const games = items.map(convertItem);
  const platforms = categories.map(convertCategory);

  // Create entities directory
  const entitiesPath = path.join(basePath, "entities");
  if (!fs.existsSync(entitiesPath)) {
    fs.mkdirSync(entitiesPath, { recursive: true });
  }

  // Write new entity files
  fs.writeFileSync(
    path.join(entitiesPath, "games.json"),
    JSON.stringify(games, null, 2)
  );

  fs.writeFileSync(
    path.join(entitiesPath, "platforms.json"),
    JSON.stringify(platforms, null, 2)
  );

  console.log(`Created entities/games.json (${games.length} games)`);
  console.log(`Created entities/platforms.json (${platforms.length} platforms)`);

  // Note: Keep old files for backward compatibility during transition
  console.log(
    "\nMigration complete! Old files kept for backward compatibility."
  );
  console.log(
    "Remove items.json and categories.json when ready to switch fully."
  );
}

// Run if called directly
const collectionId = process.argv[2];

if (!collectionId) {
  console.error("Usage: npx ts-node scripts/migrate-collection.ts <collection-id>");
  process.exit(1);
}

migrate(collectionId).catch((error: unknown) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
