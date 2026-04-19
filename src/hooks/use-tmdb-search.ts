"use client";

import { useState, useEffect, useRef } from "react";

interface MovieSearchResult {
  id: number;
  title: string;
  year: string | null;
  posterPath: string | null;
  voteAverage: number;
}

export function useTmdbSearch(query: string, debounceMs = 300) {
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const timeout = setTimeout(async () => {
      // Abort previous request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(
          `/api/movies/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timeout);
    };
  }, [query, debounceMs]);

  return { results, loading };
}
