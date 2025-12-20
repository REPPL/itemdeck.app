import { type CardData } from "@/types/card";

/**
 * Sample titles for generating varied mock data.
 */
const TITLES = [
  "Mountain Vista",
  "Urban Skyline",
  "Forest Path",
  "Ocean Waves",
  "Desert Dunes",
  "Autumn Leaves",
  "Night Sky",
  "Waterfall",
  "Flower Garden",
  "Snowy Peak",
  "Lake Reflection",
  "Sunset Beach",
  "Ancient Ruins",
  "Misty Valley",
  "Coastal Cliffs",
  "Tropical Paradise",
  "Northern Lights",
  "Rolling Hills",
  "Cherry Blossoms",
  "Canyon Vista",
  "Bamboo Grove",
  "Lighthouse",
  "Meadow Flowers",
  "Volcanic Lake",
  "Ice Cave",
  "Rainforest",
  "Savanna Sunset",
  "Alpine Stream",
  "Sand Dunes",
  "Coral Reef",
  "Lavender Fields",
  "Thunderstorm",
  "Glacier",
  "Hot Springs",
  "Redwood Forest",
  "River Delta",
  "Marble Caves",
  "Salt Flats",
  "Fireflies",
  "Tidal Pools",
];

/**
 * Generate a year between 2018 and 2024, or undefined.
 */
function generateYear(index: number): string | undefined {
  // ~20% of cards have no year
  if (index % 5 === 3) return undefined;
  const baseYear = 2018;
  const yearOffset = index % 7;
  return String(baseYear + yearOffset);
}

/**
 * Generate mock cards for development and testing.
 * Uses picsum.photos for placeholder images.
 *
 * @param count Number of cards to generate
 */
export function generateMockCards(count: number): CardData[] {
  return Array.from({ length: count }, (_, index) => {
    const id = String(index + 1);
    const titleIndex = index % TITLES.length;
    const title = TITLES[titleIndex] ?? `Card ${id}`;

    return {
      id,
      title: count > TITLES.length ? `${title} #${String(Math.floor(index / TITLES.length) + 1)}` : title,
      year: generateYear(index),
      imageUrl: `https://picsum.photos/seed/card${id}/400/300`,
      summary: index % 3 === 0 ? `Description for ${title.toLowerCase()}.` : undefined,
    };
  });
}

/**
 * Default mock cards - 100 cards for testing grid performance.
 */
export const mockCards: CardData[] = generateMockCards(100);
