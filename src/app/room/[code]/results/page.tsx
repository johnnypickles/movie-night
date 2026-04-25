"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Star, Clock, Calendar, ThumbsUp, Loader2, ArrowLeft, Eye, Check, RefreshCw, Shuffle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GENRE_LABELS } from "@/lib/survey-weights";
import { tmdb } from "@/lib/tmdb";
import { useSession } from "@/hooks/use-session";

interface Recommendation {
  id: string;
  tmdbMovieId: number;
  title: string;
  posterPath: string | null;
  overview: string | null;
  matchScore: number;
  explanation: string;
  rank: number;
  genreIds: string;
  releaseYear: number | null;
  runtime: number | null;
  voteAverage: number | null;
  votes: number;
  chosen: boolean;
}

export default function ResultsPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const { user } = useSession();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [watchedMovies, setWatchedMovies] = useState<Set<number>>(new Set());
  const [markingWatched, setMarkingWatched] = useState<number | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [swapNotice, setSwapNotice] = useState("");

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch(`/api/rooms/${code}`);
        if (!res.ok) throw new Error("Failed to fetch room");
        const data = await res.json();

        if (data.recommendations?.length > 0) {
          setRecommendations(data.recommendations);
        } else if (data.status === "PROCESSING") {
          // Poll until ready
          setTimeout(fetchResults, 2000);
          return;
        } else {
          setError("No recommendations yet. Go back to the lobby.");
        }
      } catch {
        setError("Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [code]);

  // Fetch watched movies to show status
  useEffect(() => {
    if (!user) return;
    fetch("/api/history")
      .then((r) => r.json())
      .then((data) => {
        const ids = new Set<number>(
          (data.history || []).map((h: { tmdbMovieId: number }) => h.tmdbMovieId)
        );
        setWatchedMovies(ids);
      })
      .catch(() => {});
  }, [user]);

  async function markAsWatched(tmdbMovieId: number, title: string, posterPath: string | null) {
    if (!user) return;
    setMarkingWatched(tmdbMovieId);
    setSwapNotice("");
    try {
      await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbMovieId, title, posterPath }),
      });
      setWatchedMovies((prev) => new Set(prev).add(tmdbMovieId));

      // Swap that pick with the next-best compatible movie.
      const res = await fetch(`/api/rooms/${code}/replace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbMovieId }),
      });
      if (res.ok) {
        const data = await res.json();
        const newRec = data.recommendation;
        setRecommendations((prev) =>
          prev.map((r) =>
            r.tmdbMovieId === tmdbMovieId
              ? {
                  ...r,
                  ...newRec,
                  // Maintain shape: convert genreIds back to JSON string for our state.
                  genreIds: JSON.stringify(newRec.genreIds),
                  releaseYear: newRec.releaseDate
                    ? parseInt(newRec.releaseDate.slice(0, 4), 10)
                    : null,
                  runtime: null,
                  votes: 0,
                  chosen: false,
                  id: r.id, // keep db id stable in UI; server has its own new row
                }
              : r
          )
        );
        setSwapNotice(`Swapped in: ${newRec.title}`);
        setTimeout(() => setSwapNotice(""), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setSwapNotice(data?.error || "No more matches to swap in.");
        setTimeout(() => setSwapNotice(""), 3000);
      }
    } catch {
      // ignore
    } finally {
      setMarkingWatched(null);
    }
  }

  async function regenerate() {
    if (regenerating) return;
    setRegenerating(true);
    setSwapNotice("");
    try {
      const res = await fetch(`/api/rooms/${code}/regenerate`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSwapNotice(data?.error || "Couldn't regenerate.");
        setTimeout(() => setSwapNotice(""), 3000);
        return;
      }
      const data = await res.json();
      setRecommendations(
        data.recommendations.map((r: {
          tmdbMovieId: number;
          title: string;
          posterPath: string | null;
          overview: string | null;
          matchScore: number;
          explanation: string;
          rank: number;
          voteAverage: number | null;
          releaseDate: string | null;
          genreIds: number[];
        }) => ({
          id: `regen-${r.tmdbMovieId}`,
          tmdbMovieId: r.tmdbMovieId,
          title: r.title,
          posterPath: r.posterPath,
          overview: r.overview,
          matchScore: r.matchScore,
          explanation: r.explanation,
          rank: r.rank,
          genreIds: JSON.stringify(r.genreIds),
          releaseYear: r.releaseDate
            ? parseInt(r.releaseDate.slice(0, 4), 10)
            : null,
          runtime: null,
          voteAverage: r.voteAverage,
          votes: 0,
          chosen: false,
        }))
      );
    } finally {
      setRegenerating(false);
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-accent-400 mx-auto mb-4" />
            <p className="text-cinema-700">Loading recommendations...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-accent-500/10 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-accent-400" />
            </div>
            <h1 className="text-3xl font-bold text-cinema-900 mb-2">
              Your Movie Matches
            </h1>
            <p className="text-cinema-700">
              Based on everyone&apos;s preferences, here are your top picks
            </p>
          </div>

          {recommendations.length > 0 && !error && (
            <div className="flex flex-col items-center mb-6 gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={regenerate}
                disabled={regenerating}
              >
                {regenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Reshuffling…
                  </>
                ) : (
                  <>
                    <Shuffle className="w-4 h-4" />
                    Show me different movies
                  </>
                )}
              </Button>
              {swapNotice && (
                <p className="font-typewriter text-xs text-cinema-700 text-center">
                  {swapNotice}
                </p>
              )}
            </div>
          )}

          {error ? (
            <div className="text-center py-12">
              <p className="text-cinema-700 mb-4">{error}</p>
              <Link href={`/room/${code}`}>
                <Button variant="secondary">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Lobby
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {recommendations.map((rec, i) => {
                const genreIds: number[] = JSON.parse(rec.genreIds || "[]");
                const posterUrl = tmdb.posterUrl(rec.posterPath, "w342");
                const isTop = i === 0;

                return (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.15 }}
                  >
                    <Card
                      className={cn(
                        "overflow-hidden",
                        isTop && "border-accent-500/30 shadow-accent-500/5 shadow-2xl"
                      )}
                    >
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row">
                          {/* Poster */}
                          <div className="relative sm:w-40 flex-shrink-0">
                            {posterUrl ? (
                              <Image
                                src={posterUrl}
                                alt={rec.title}
                                width={342}
                                height={513}
                                className="w-full sm:w-40 h-48 sm:h-full object-cover"
                              />
                            ) : (
                              <div className="w-full sm:w-40 h-48 sm:h-full bg-cinema-800 flex items-center justify-center">
                                <span className="text-cinema-600 text-4xl">🎬</span>
                              </div>
                            )}
                            {/* Rank badge */}
                            <div
                              className={cn(
                                "absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                                isTop
                                  ? "bg-accent-500 text-cinema-950"
                                  : "bg-cinema-700 text-cinema-900"
                              )}
                            >
                              #{rec.rank}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 p-5">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div>
                                <h3 className="text-xl font-bold text-cinema-900">
                                  {rec.title}
                                </h3>
                                <div className="flex items-center gap-3 mt-1 text-sm text-cinema-700">
                                  {rec.releaseYear && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3.5 h-3.5" />
                                      {rec.releaseYear}
                                    </span>
                                  )}
                                  {rec.voteAverage && (
                                    <span className="flex items-center gap-1">
                                      <Star className="w-3.5 h-3.5 text-accent-400" />
                                      {rec.voteAverage.toFixed(1)}
                                    </span>
                                  )}
                                  {rec.runtime && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5" />
                                      {rec.runtime}m
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Match Score */}
                              <div
                                className={cn(
                                  "flex-shrink-0 px-3 py-1.5 text-sm font-condensed uppercase tracking-wider border-2 border-cinema-900",
                                  rec.matchScore >= 80
                                    ? "bg-success text-cinema-50"
                                    : rec.matchScore >= 60
                                    ? "bg-gold-500 text-cinema-900"
                                    : "bg-cinema-100 text-cinema-900"
                                )}
                              >
                                {rec.matchScore}% match
                              </div>
                            </div>

                            {/* Genres */}
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {genreIds.slice(0, 4).map((gId) => (
                                <span
                                  key={gId}
                                  className="font-condensed uppercase tracking-widest text-xs px-2 py-0.5 bg-cinema-900 text-cinema-50 border border-cinema-900"
                                >
                                  {GENRE_LABELS[gId] || gId}
                                </span>
                              ))}
                            </div>

                            {/* Overview */}
                            {rec.overview && (
                              <p className="font-serif text-sm text-cinema-900 mb-3 line-clamp-2">
                                {rec.overview}
                              </p>
                            )}

                            {/* Explanation */}
                            <div className="bg-gold-400/40 border-2 border-cinema-900 px-3 py-2 font-serif italic text-sm text-cinema-900 mb-3">
                              💡 {rec.explanation}
                            </div>

                            {/* Mark as Watched button */}
                            {user && (
                              <div className="mt-3">
                                {watchedMovies.has(rec.tmdbMovieId) ? (
                                  <span className="inline-flex items-center gap-1.5 font-condensed uppercase tracking-widest text-xs text-success">
                                    <Check className="w-4 h-4" />
                                    Watched
                                  </span>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() =>
                                      markAsWatched(
                                        rec.tmdbMovieId,
                                        rec.title,
                                        rec.posterPath
                                      )
                                    }
                                    disabled={markingWatched === rec.tmdbMovieId}
                                  >
                                    {markingWatched === rec.tmdbMovieId ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Eye className="w-4 h-4" />
                                    )}
                                    Mark as Watched
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Back to lobby */}
          <div className="mt-10 text-center">
            <Link href={`/room/${code}`}>
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4" />
                Back to Lobby
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>
    </>
  );
}

