"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Star, Clock, Calendar, ThumbsUp, Loader2, ArrowLeft, Eye, Check } from "lucide-react";
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
    try {
      await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbMovieId, title, posterPath }),
      });
      setWatchedMovies((prev) => new Set(prev).add(tmdbMovieId));
    } catch {
      // ignore
    } finally {
      setMarkingWatched(null);
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-accent-400 mx-auto mb-4" />
            <p className="text-cinema-400">Loading recommendations...</p>
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
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-accent-500/10 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-accent-400" />
            </div>
            <h1 className="text-3xl font-bold text-cinema-100 mb-2">
              Your Movie Matches
            </h1>
            <p className="text-cinema-400">
              Based on everyone&apos;s preferences, here are your top picks
            </p>
          </div>

          {error ? (
            <div className="text-center py-12">
              <p className="text-cinema-400 mb-4">{error}</p>
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
                                  : "bg-cinema-700 text-cinema-200"
                              )}
                            >
                              #{rec.rank}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 p-5">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div>
                                <h3 className="text-xl font-bold text-cinema-100">
                                  {rec.title}
                                </h3>
                                <div className="flex items-center gap-3 mt-1 text-sm text-cinema-400">
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
                                  "flex-shrink-0 rounded-xl px-3 py-1.5 text-sm font-bold",
                                  rec.matchScore >= 80
                                    ? "bg-success/10 text-success"
                                    : rec.matchScore >= 60
                                    ? "bg-accent-500/10 text-accent-400"
                                    : "bg-cinema-700 text-cinema-300"
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
                                  className="text-xs px-2 py-0.5 rounded-md bg-cinema-800 text-cinema-400"
                                >
                                  {GENRE_LABELS[gId] || gId}
                                </span>
                              ))}
                            </div>

                            {/* Overview */}
                            {rec.overview && (
                              <p className="text-sm text-cinema-400 mb-3 line-clamp-2">
                                {rec.overview}
                              </p>
                            )}

                            {/* Explanation */}
                            <div className="bg-cinema-800/50 rounded-lg px-3 py-2 text-sm text-cinema-300">
                              💡 {rec.explanation}
                            </div>

                            {/* Mark as Watched button */}
                            {user && (
                              <div className="mt-3">
                                {watchedMovies.has(rec.tmdbMovieId) ? (
                                  <span className="inline-flex items-center gap-1.5 text-sm text-success">
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
