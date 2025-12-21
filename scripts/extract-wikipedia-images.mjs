#!/usr/bin/env node
/**
 * Wikipedia Image Extraction Script
 *
 * Fetches representative images from Wikipedia articles for items in the collection.
 * Uses the MediaWiki Images API to get all images, then picks the best one.
 *
 * Usage: node scripts/extract-wikipedia-images.mjs
 */

import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ITEMS_PATH = join(__dirname, '../public/data/collections/retro-games/items.json');
const THUMBNAIL_SIZE = 400;
const DELAY_MS = 200; // Be nice to Wikipedia's servers

/**
 * Extract article title from a Wikipedia URL.
 */
function extractWikipediaTitle(url) {
  if (!url || !url.includes('wikipedia.org')) {
    return null;
  }

  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;

    // Handle /wiki/Article_Title format
    const wikiMatch = path.match(/\/wiki\/(.+)$/);
    if (wikiMatch) {
      return decodeURIComponent(wikiMatch[1]);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Prioritise images by filename patterns.
 * Higher score = better match for box art / cover art.
 */
function scoreImageFilename(filename) {
  const lower = filename.toLowerCase();

  // Definitely skip: Commons/Wikipedia logos and generic media
  if (lower.includes('commons-logo') || lower.includes('wiki') || lower.includes('ambox')) {
    return -100;
  }
  // Skip icons, flags, portraits
  if (lower.includes('icon') || lower.includes('flag') || lower.includes('portrait') || lower.includes('photo')) {
    return -50;
  }
  // Skip SVGs (often logos/icons)
  if (lower.endsWith('.svg')) {
    return -20;
  }

  // Best: explicit cover/box art
  if (lower.includes('coverart') || lower.includes('cover_art') || lower.includes('box_art') || lower.includes('boxart')) {
    return 100;
  }
  if (lower.includes('cover') || lower.includes('box')) {
    return 80;
  }
  // Good: game logos (specific to the game)
  if (lower.includes('logo') || lower.includes('title')) {
    return 60;
  }
  // Screenshots are useful fallbacks
  if (lower.includes('screenshot')) {
    return 40;
  }
  // Default
  return 30;
}

/**
 * Fetch all images from a Wikipedia article.
 */
async function fetchWikipediaImages(title) {
  const params = new URLSearchParams({
    action: 'query',
    titles: title,
    prop: 'images',
    imlimit: '20',
    format: 'json',
    origin: '*'
  });

  const apiUrl = `https://en.wikipedia.org/w/api.php?${params.toString()}`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'itemdeck/1.0 (https://github.com/REPPL/itemdeck)'
      }
    });

    if (!response.ok) {
      console.error(`  HTTP error ${response.status} for "${title}"`);
      return null;
    }

    const data = await response.json();
    const pages = data.query?.pages;

    if (!pages) {
      return null;
    }

    const page = Object.values(pages)[0];
    if (!page || page.missing !== undefined || !page.images) {
      return null;
    }

    // Sort images by score
    const images = page.images
      .map(img => ({
        title: img.title,
        filename: img.title.replace('File:', ''),
        score: scoreImageFilename(img.title)
      }))
      .sort((a, b) => b.score - a.score);

    return images;
  } catch (error) {
    console.error(`  Error fetching images for "${title}":`, error.message);
    return null;
  }
}

/**
 * Get thumbnail URL for a specific file from Commons/Wikipedia.
 */
async function getImageThumbnail(filename) {
  const params = new URLSearchParams({
    action: 'query',
    titles: `File:${filename}`,
    prop: 'imageinfo',
    iiprop: 'url',
    iiurlwidth: String(THUMBNAIL_SIZE),
    format: 'json',
    origin: '*'
  });

  // Try Wikipedia first (for fair use images)
  const apiUrl = `https://en.wikipedia.org/w/api.php?${params.toString()}`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'itemdeck/1.0 (https://github.com/REPPL/itemdeck)'
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const pages = data.query?.pages;

    if (!pages) {
      return null;
    }

    const page = Object.values(pages)[0];
    if (!page || !page.imageinfo || !page.imageinfo[0]) {
      return null;
    }

    const info = page.imageinfo[0];
    return info.thumburl || info.url;
  } catch (error) {
    return null;
  }
}

/**
 * Sleep for a specified number of milliseconds.
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main extraction function.
 */
async function main() {
  console.log('Wikipedia Image Extraction Script');
  console.log('==================================\n');

  // Read existing items
  const itemsJson = await readFile(ITEMS_PATH, 'utf-8');
  const items = JSON.parse(itemsJson);

  console.log(`Found ${items.length} items\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;
  let noWikipedia = 0;

  // Process each item
  for (const item of items) {
    const { id, title, detailUrl, imageUrl } = item;

    // Skip if already has a good image (not placeholder or Commons logo)
    if (imageUrl && !imageUrl.includes('picsum.photos') && !imageUrl.includes('Commons-logo')) {
      console.log(`[SKIP] ${title} - already has imageUrl`);
      skipped++;
      continue;
    }

    // Extract Wikipedia title
    const wikiTitle = extractWikipediaTitle(detailUrl);

    if (!wikiTitle) {
      console.log(`[SKIP] ${title} - no Wikipedia URL`);
      noWikipedia++;
      continue;
    }

    console.log(`[FETCH] ${title} (${wikiTitle})`);

    // Fetch list of images from the article
    const images = await fetchWikipediaImages(wikiTitle);
    await sleep(DELAY_MS);

    if (!images || images.length === 0) {
      console.warn(`  No images found`);
      failed++;
      continue;
    }

    // Filter to positive scores only, then try to get thumbnail
    const validImages = images.filter(img => img.score > 0);

    if (validImages.length === 0) {
      console.warn(`  No valid images (all scored <= 0)`);
      failed++;
      continue;
    }

    let foundImage = false;
    for (const img of validImages.slice(0, 5)) { // Try top 5 candidates
      const thumbnailUrl = await getImageThumbnail(img.filename);
      await sleep(DELAY_MS / 2);

      if (thumbnailUrl) {
        item.imageUrl = thumbnailUrl;
        console.log(`  -> ${img.filename} (score: ${img.score})`);
        console.log(`     ${thumbnailUrl.substring(0, 70)}...`);
        updated++;
        foundImage = true;
        break;
      }
    }

    if (!foundImage) {
      console.warn(`  Could not get thumbnail for any image`);
      failed++;
    }
  }

  console.log('\n==================================');
  console.log('Summary:');
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped (already had image): ${skipped}`);
  console.log(`  Skipped (no Wikipedia URL): ${noWikipedia}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total: ${items.length}`);

  // Write updated items back
  if (updated > 0) {
    const outputJson = JSON.stringify(items, null, 2);
    await writeFile(ITEMS_PATH, outputJson, 'utf-8');
    console.log(`\nWrote updated items to ${ITEMS_PATH}`);
  } else {
    console.log('\nNo updates needed.');
  }
}

// Run
main().catch(console.error);
