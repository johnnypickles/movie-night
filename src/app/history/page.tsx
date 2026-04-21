"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { History, Star, Loader2, Film } from "lucide-react";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import { useRouter } from "next/navigation";
import { tmdb } from "@/lib/tmdb";

interface HistoryItem {
  id: string;
  tmdbMovieId: number;
  title: string;
  posterPath: string | null;
  watchedAt: string;
  rating: {
    id: string;
    rating: number;
    comment: string | null;
  } | null;
}

export default function HistoryPage() {
  const { user, loading: sessionLoading } = useSession();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingMovie, setRatingMovie] = useState<number | null>(null);
  const [ratingValue, setRatingValue] = useState(7);
  const [ratingComment, setRatingComment] = useState("");
  const [savingRating, setSavingRating] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !user) {
      router.push("/login");
    }
  }, [user, sessionLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/history")
      .then((r) => r.json())
      .then((data) => setHistory(data.history || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  async function submitRating(tmdbMovieId: number) {
    setSavingRating(true);
    try {
      await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbMovieId,
          rating: ratingValue,
          comment: ratingComment || null,
        }),
      });
      // Refresh history
      const res = await fetch("/api/history");
      const data = await res.json();
      setHistory(data.history || []);
      setRatingMovie(null);
      setRatingComment("");
    } catch {
      // ignore
    } finally {
      setSavingRating(false);
    }
  }

  if (sessionLoading || !user) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cinema-700" />
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
          transition={{ duration: 0.4 }}
        >
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-xl bg-accent-500/10 flex items-center justify-center mx-auto mb-4">
              <History className="w-7 h-7 text-accent-400" />
            </div>
            <h1 className="text-3xl font-bold text-cinema-900">Watch History</h1>
            <p className="text-cinema-700 mt-1">Movies you&apos;ve watched with your groups</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cinema-700 mx-auto" />
            </div>
          ) : history.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Film className="w-12 h-12 text-cinema-600 mx-auto mb-4" />
                <p className="text-cinema-700 mb-4">No movies watched yet!</p>
                <p className="text-cinema-700 text-sm mb-6">
                  Create a room, take the survey, and mark a movie as watched from the results page.
                </p>
                <Button onClick={() => router.push("/room/create")} variant="secondary">
                  Start a Movie Night
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {history.map((item, i) => {
                const posterUrl = tmdb.posterUrl(item.posterPath, "w185");
                const isRating = ratingMovie === item.tmdbMovieId;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Poster */}
                          {posterUrl ? (
                            <Image
                              src={posterUrl}
                              alt={item.title}
                              width={185}
                              height={278}
                              className="w-16 h-24 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-24 rounded-lg bg-cinema-700 flex items-center justify-center flex-shrink-0">
                              <Film className="w-6 h-6 text-cinema-700" />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-cinema-900 truncate">
                              {item.title}
                            </h3>
                            <p className="text-xs text-cinema-700 mt-0.5">
                              Watched {new Date(item.watchedAt).toLocaleDateString()}
                            </p>

                            {/* Rating display or input */}
                            {item.rating && !isRating ? (
                              <div className="mt-2">
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 10 }, (_, j) => (
                                    <Star
                                      key={j}
                                      className={cn(
                                        "w-3.5 h-3.5",
                                        j < item.rating!.rating
                                          ? "text-accent-400 fill-accent-400"
                                          : "text-cinema-700"
                                      )}
                                    />
                                  ))}
                                  <span className="text-xs text-cinema-700 ml-1">
                                    {item.rating.rating}/10
                                  </span>
                                </div>
                                {item.rating.comment && (
                                  <p className="text-xs text-cinema-700 mt-1 italic">
                                    &quot;{item.rating.comment}&quot;
                                  </p>
                                )}
                                <button
                                  onClick={() => {
                                    setRatingMovie(item.tmdbMovieId);
                                    setRatingValue(item.rating!.rating);
                                    setRatingComment(item.rating!.comment || "");
                                  }}
                                  className="text-xs text-cinema-700 hover:text-cinema-800 mt-1 cursor-pointer"
                                >
                                  Edit rating
                                </button>
                              </div>
                            ) : isRating ? (
                              <div className="mt-3 space-y-2">
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 10 }, (_, j) => (
                                    <button
                                      key={j}
                                      onClick={() => setRatingValue(j + 1)}
                                      className="cursor-pointer"
                                    >
                                      <Star
                                        className={cn(
                                          "w-6 h-6 transition-colors",
                                          j < ratingValue
                                            ? "text-gold-500 fill-gold-500"
                                            : "text-cinema-700/40 hover:text-gold-400"
                                        )}
                                      />
                                    </button>
                                  ))}
                                  <span className="text-sm text-cinema-800 ml-2">
                                    {ratingValue}/10
                                  </span>
                                </div>
                                <textarea
                                  placeholder="Add a comment (optional)"
                                  value={ratingComment}
                                  onChange={(e) => setRatingComment(e.target.value)}
                                  rows={2}
                                  maxLength={500}
                                  className="w-full text-sm bg-cinema-50 border-2 border-cinema-900 px-3 py-2 font-typewriter text-cinema-900 placeholder:text-cinema-700/60 focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => submitRating(item.tmdbMovieId)}
                                    disabled={savingRating}
                                  >
                                    {savingRating ? "Saving..." : "Save"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setRatingMovie(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setRatingMovie(item.tmdbMovieId);
                                  setRatingValue(7);
                                  setRatingComment("");
                                }}
                                className="mt-2 text-xs text-accent-400 hover:text-accent-300 cursor-pointer flex items-center gap-1"
                              >
                                <Star className="w-3 h-3" />
                                Rate this movie
                              </button>
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
        </motion.div>
      </main>
    </>
  );
}
