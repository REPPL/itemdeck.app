import { useState, useEffect } from "react";
import { type CardData } from "@/types/card";

interface UseCardDataResult {
  cards: CardData[];
  loading: boolean;
  error: string | null;
}

const DATA_BASE_URL = "/data/collections/retro-games";

/**
 * Hook to fetch and manage card data from local JSON files.
 *
 * Fetches items.json which is already in CardData format.
 */
export function useCardData(): UseCardDataResult {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`${DATA_BASE_URL}/items.json`);

        if (!response.ok) {
          throw new Error(`Failed to fetch items: ${String(response.status)}`);
        }

        const items = (await response.json()) as CardData[];

        // Add placeholder images for items without imageUrl
        const cardsWithImages: CardData[] = items.map((item) => ({
          ...item,
          imageUrl:
            item.imageUrl ||
            `https://picsum.photos/seed/${item.id}/400/300`,
        }));

        setCards(cardsWithImages);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load cards");
        setLoading(false);
      }
    }

    void fetchData();
  }, []);

  return { cards, loading, error };
}
