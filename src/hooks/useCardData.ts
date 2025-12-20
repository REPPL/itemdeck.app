import { useState, useEffect } from "react";
import { type CardData } from "@/types/card";
import { mockCards } from "@/data/cards.mock";

interface UseCardDataResult {
  cards: CardData[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and manage card data.
 *
 * Currently returns mock data immediately.
 * TODO: Replace with fetch from JSON URL in Phase 2.
 */
export function useCardData(): UseCardDataResult {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate async data loading for realistic behaviour
    const timer = setTimeout(() => {
      try {
        setCards(mockCards);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load cards");
        setLoading(false);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return { cards, loading, error };
}
