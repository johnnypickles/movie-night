"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, Search } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MOOD_LABELS, GENRE_LABELS, type Mood } from "@/lib/survey-weights";
import { VIBE_WORDS } from "@/types/survey";
import { useTmdbSearch } from "@/hooks/use-tmdb-search";
import { tmdb } from "@/lib/tmdb";

const TOTAL_STEPS = 6;

interface FavoriteMovie {
  id: number;
  title: string;
  year: string | null;
  posterPath: string | null;
}

export default function SurveyPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Survey state
  const [mood, setMood] = useState<Mood | null>(null);
  const [vibeWords, setVibeWords] = useState<string[]>([]);
  const [genreLikes, setGenreLikes] = useState<number[]>([]);
  const [genreDislikes, setGenreDislikes] = useState<number[]>([]);
  const [decadeMin, setDecadeMin] = useState<number | null>(null);
  const [decadeMax, setDecadeMax] = useState<number | null>(null);
  const [maxRuntime, setMaxRuntime] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);
  const [movieSearch, setMovieSearch] = useState("");
  const [noSubtitles, setNoSubtitles] = useState(false);
  const [noBlackWhite, setNoBlackWhite] = useState(false);
  const [noAnimation, setNoAnimation] = useState(false);
  const [noHorror, setNoHorror] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  // Load existing response (if any) so Edit-My-Answers pre-fills.
  useEffect(() => {
    const participantId = localStorage.getItem(`room-${code}-userId`);
    if (!participantId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/rooms/${code}/survey?participantId=${encodeURIComponent(
            participantId
          )}`
        );
        const data = await res.json();
        if (cancelled || !data?.response) return;
        const r = data.response;
        setIsEdit(true);
        if (r.mood) setMood(r.mood);
        if (Array.isArray(r.vibeWords)) setVibeWords(r.vibeWords);
        if (Array.isArray(r.genreLikes)) setGenreLikes(r.genreLikes);
        if (Array.isArray(r.genreDislikes)) setGenreDislikes(r.genreDislikes);
        if (typeof r.decadeMin === "number") setDecadeMin(r.decadeMin);
        if (typeof r.decadeMax === "number") setDecadeMax(r.decadeMax);
        if (typeof r.maxRuntime === "number") setMaxRuntime(r.maxRuntime);
        if (typeof r.minRating === "number") setMinRating(r.minRating);
        if (typeof r.noSubtitles === "boolean") setNoSubtitles(r.noSubtitles);
        if (typeof r.noBlackWhite === "boolean") setNoBlackWhite(r.noBlackWhite);
        if (typeof r.noAnimation === "boolean") setNoAnimation(r.noAnimation);
        if (typeof r.noHorror === "boolean") setNoHorror(r.noHorror);

        // Rehydrate favorites with details (best-effort)
        if (Array.isArray(r.favoriteMovieIds) && r.favoriteMovieIds.length > 0) {
          const details = await Promise.all(
            r.favoriteMovieIds.slice(0, 5).map(async (id: number) => {
              try {
                const d = await tmdb.getMovieDetails(id);
                return {
                  id: d.id,
                  title: d.title,
                  year: d.release_date ? d.release_date.slice(0, 4) : null,
                  posterPath: d.poster_path,
                };
              } catch {
                return null;
              }
            })
          );
          if (cancelled) return;
          setFavorites(details.filter((d): d is FavoriteMovie => d !== null));
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  const { results: searchResults, loading: searchLoading } =
    useTmdbSearch(movieSearch);

  function toggleGenreLike(id: number) {
    setGenreDislikes((prev) => prev.filter((g) => g !== id));
    setGenreLikes((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }

  function toggleGenreDislike(id: number) {
    setGenreLikes((prev) => prev.filter((g) => g !== id));
    setGenreDislikes((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }

  function toggleVibe(word: string) {
    setVibeWords((prev) =>
      prev.includes(word)
        ? prev.filter((w) => w !== word)
        : prev.length < 5
        ? [...prev, word]
        : prev
    );
  }

  function addFavorite(movie: FavoriteMovie) {
    if (favorites.length < 3 && !favorites.find((f) => f.id === movie.id)) {
      setFavorites((prev) => [...prev, movie]);
      setMovieSearch("");
    }
  }

  function removeFavorite(id: number) {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleSubmit() {
    if (!mood) {
      setError("Please select a mood");
      setStep(1);
      return;
    }

    setSubmitting(true);
    setError("");

    // Get participantId from localStorage (set during create/join)
    const participantId = localStorage.getItem(`room-${code}-userId`);
    if (!participantId) {
      setError("Session expired. Please rejoin the room.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/rooms/${code}/survey`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          surveyData: {
            mood,
            vibeWords,
            genreLikes,
            genreDislikes,
            decadeMin,
            decadeMax,
            maxRuntime,
            minRating,
            favoriteMovieIds: favorites.map((f) => f.id),
            noSubtitles,
            noBlackWhite,
            noAnimation,
            noHorror,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit survey");
      }

      router.push(`/room/${code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 200 : -200,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({
      x: direction > 0 ? -200 : 200,
      opacity: 0,
    }),
  };

  const [direction, setDirection] = useState(1);

  function goNext() {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  }

  return (
    <>
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-cinema-700 mb-2">
            <span>Step {step} of {TOTAL_STEPS}</span>
            <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
          </div>
          <div className="h-2 bg-cinema-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent-500 to-accent-400 rounded-full"
              animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Survey Steps */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25 }}
          >
            {/* Step 1: Mood */}
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-cinema-900 mb-2 text-center">
                  What&apos;s your vibe tonight?
                </h2>
                <p className="text-cinema-700 text-center mb-8">
                  Pick the mood that matches how you&apos;re feeling
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {(Object.entries(MOOD_LABELS) as [Mood, typeof MOOD_LABELS[Mood]][]).map(
                    ([key, { label, emoji, description }]) => (
                      <button
                        key={key}
                        onClick={() => setMood(key)}
                        className={cn(
                          "rounded-2xl border-2 p-5 text-center transition-all duration-200 cursor-pointer hover:scale-[1.02]",
                          mood === key
                            ? "border-accent-500 bg-accent-500/10 shadow-lg shadow-accent-500/10"
                            : "border-cinema-900/30 bg-cinema-50 hover:border-cinema-900"
                        )}
                      >
                        <div className="text-3xl mb-2">{emoji}</div>
                        <div className="font-semibold text-cinema-900">{label}</div>
                        <div className="text-xs text-cinema-700 mt-1">
                          {description}
                        </div>
                      </button>
                    )
                  )}
                </div>

                {/* Vibe words */}
                <div className="mt-8">
                  <p className="text-sm text-cinema-700 mb-3 text-center">
                    Pick up to 5 vibe words (optional)
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {VIBE_WORDS.map((word) => (
                      <button
                        key={word}
                        onClick={() => toggleVibe(word)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm transition-all cursor-pointer",
                          vibeWords.includes(word)
                            ? "bg-accent-500/20 text-accent-400 border border-accent-500/50"
                            : "bg-cinema-800 text-cinema-700 border border-cinema-900/30 hover:border-cinema-900"
                        )}
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Genres */}
            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-cinema-900 mb-2 text-center">
                  Genre Preferences
                </h2>
                <p className="text-cinema-700 text-center mb-6">
                  Tap to like (green) or tap again to dislike (red). Leave unselected for no preference.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(GENRE_LABELS).map(([idStr, name]) => {
                    const id = parseInt(idStr);
                    const isLiked = genreLikes.includes(id);
                    const isDisliked = genreDislikes.includes(id);
                    return (
                      <button
                        key={id}
                        onClick={() => {
                          if (isLiked) {
                            toggleGenreDislike(id);
                          } else if (isDisliked) {
                            setGenreDislikes((prev) => prev.filter((g) => g !== id));
                          } else {
                            toggleGenreLike(id);
                          }
                        }}
                        className={cn(
                          "rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all cursor-pointer",
                          isLiked
                            ? "border-success bg-success/10 text-success"
                            : isDisliked
                            ? "border-danger bg-danger/10 text-danger"
                            : "border-cinema-900/30 bg-cinema-50 text-cinema-800 hover:border-cinema-900"
                        )}
                      >
                        {isLiked && "✓ "}
                        {isDisliked && "✕ "}
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Era */}
            {step === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-cinema-900 mb-2 text-center">
                  How new should it be?
                </h2>
                <p className="text-cinema-700 text-center mb-8">
                  Pick an era or leave blank for any time period
                </p>
                <div className="space-y-4">
                  {[
                    { label: "Any Era", min: null, max: null },
                    { label: "Classic (before 1980)", min: 1920, max: 1979 },
                    { label: "80s & 90s", min: 1980, max: 1999 },
                    { label: "2000s", min: 2000, max: 2009 },
                    { label: "Modern (2010+)", min: 2010, max: null },
                    { label: "Recent Hits (2020+)", min: 2020, max: null },
                  ].map((era) => (
                    <button
                      key={era.label}
                      onClick={() => {
                        setDecadeMin(era.min);
                        setDecadeMax(era.max);
                      }}
                      className={cn(
                        "w-full rounded-xl border-2 px-6 py-4 text-left transition-all cursor-pointer",
                        decadeMin === era.min && decadeMax === era.max
                          ? "border-accent-500 bg-accent-500/10"
                          : "border-cinema-900/30 bg-cinema-50 hover:border-cinema-900"
                      )}
                    >
                      <span className="font-medium text-cinema-900">
                        {era.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Runtime & Rating */}
            {step === 4 && (
              <div>
                <h2 className="text-2xl font-bold text-cinema-900 mb-2 text-center">
                  Runtime & Quality
                </h2>
                <p className="text-cinema-700 text-center mb-8">
                  Set your preferences for length and rating
                </p>

                <div className="space-y-8">
                  {/* Runtime */}
                  <div>
                    <h3 className="font-semibold text-cinema-900 mb-4">
                      How long are you willing to sit?
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Quick (< 90 min)", value: 90 },
                        { label: "Standard (~2 hrs)", value: 130 },
                        { label: "Epic (2.5+ hrs)", value: 300 },
                        { label: "No preference", value: null },
                      ].map((opt) => (
                        <button
                          key={opt.label}
                          onClick={() => setMaxRuntime(opt.value)}
                          className={cn(
                            "rounded-xl border-2 px-4 py-3 text-sm transition-all cursor-pointer",
                            maxRuntime === opt.value
                              ? "border-accent-500 bg-accent-500/10 text-accent-400"
                              : "border-cinema-900/30 bg-cinema-50 text-cinema-800 hover:border-cinema-900"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <h3 className="font-semibold text-cinema-900 mb-4">
                      Quality threshold?
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Anything goes (5+)", value: 5 },
                        { label: "Decent (6+)", value: 6 },
                        { label: "Good (7+)", value: 7 },
                        { label: "Great only (7.5+)", value: 7.5 },
                      ].map((opt) => (
                        <button
                          key={opt.label}
                          onClick={() => setMinRating(opt.value)}
                          className={cn(
                            "rounded-xl border-2 px-4 py-3 text-sm transition-all cursor-pointer",
                            minRating === opt.value
                              ? "border-accent-500 bg-accent-500/10 text-accent-400"
                              : "border-cinema-900/30 bg-cinema-50 text-cinema-800 hover:border-cinema-900"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Favorite Movies */}
            {step === 5 && (
              <div>
                <h2 className="text-2xl font-bold text-cinema-900 mb-2 text-center">
                  Favorite Movies
                </h2>
                <p className="text-cinema-700 text-center mb-6">
                  Name 1-3 movies you love (optional). This helps our algorithm understand your taste.
                </p>

                {/* Selected favorites */}
                {favorites.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {favorites.map((movie) => (
                      <span
                        key={movie.id}
                        className="inline-flex items-center gap-2 bg-accent-500/10 border border-accent-500/30 text-accent-400 rounded-lg px-3 py-1.5 text-sm"
                      >
                        {movie.title} {movie.year && `(${movie.year})`}
                        <button
                          onClick={() => removeFavorite(movie.id)}
                          className="hover:text-danger transition-colors cursor-pointer"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Search */}
                {favorites.length < 3 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cinema-700" />
                    <Input
                      placeholder="Search for a movie..."
                      value={movieSearch}
                      onChange={(e) => setMovieSearch(e.target.value)}
                      className="pl-10"
                    />

                    {/* Search results dropdown */}
                    {movieSearch.length >= 2 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-cinema-100 border border-cinema-900/30 rounded-xl overflow-hidden shadow-2xl z-10 max-h-64 overflow-y-auto">
                        {searchLoading ? (
                          <div className="p-4 text-center text-cinema-700">
                            <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                            Searching...
                          </div>
                        ) : searchResults.length === 0 ? (
                          <div className="p-4 text-center text-cinema-700">
                            No movies found
                          </div>
                        ) : (
                          searchResults.map((movie) => (
                            <button
                              key={movie.id}
                              onClick={() =>
                                addFavorite({
                                  id: movie.id,
                                  title: movie.title,
                                  year: movie.year,
                                  posterPath: movie.posterPath,
                                })
                              }
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gold-400 transition-colors text-left cursor-pointer"
                            >
                              {movie.posterPath ? (
                                <img
                                  src={tmdb.posterUrl(movie.posterPath, "w92") ?? ""}
                                  alt=""
                                  className="w-8 h-12 rounded object-cover"
                                />
                              ) : (
                                <div className="w-8 h-12 rounded bg-cinema-700" />
                              )}
                              <div>
                                <div className="text-sm font-medium text-cinema-900">
                                  {movie.title}
                                </div>
                                <div className="text-xs text-cinema-700">
                                  {movie.year} · ★ {movie.voteAverage.toFixed(1)}
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 6: Dealbreakers */}
            {step === 6 && (
              <div>
                <h2 className="text-2xl font-bold text-cinema-900 mb-2 text-center">
                  Any Hard No&apos;s?
                </h2>
                <p className="text-cinema-700 text-center mb-8">
                  These will be excluded from recommendations for the whole group
                </p>
                <div className="space-y-4">
                  {[
                    {
                      label: "No subtitles (English only)",
                      value: noSubtitles,
                      setter: setNoSubtitles,
                    },
                    {
                      label: "No black & white films",
                      value: noBlackWhite,
                      setter: setNoBlackWhite,
                    },
                    {
                      label: "No animation",
                      value: noAnimation,
                      setter: setNoAnimation,
                    },
                    {
                      label: "No horror / jump scares",
                      value: noHorror,
                      setter: setNoHorror,
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => item.setter(!item.value)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-xl border-2 px-6 py-4 transition-all cursor-pointer",
                        item.value
                          ? "border-danger bg-danger/10"
                          : "border-cinema-900/30 bg-cinema-50 hover:border-cinema-900"
                      )}
                    >
                      <span
                        className={cn(
                          "font-medium",
                          item.value ? "text-danger" : "text-cinema-800"
                        )}
                      >
                        {item.label}
                      </span>
                      <div
                        className={cn(
                          "w-12 h-7 rounded-full transition-colors relative",
                          item.value ? "bg-danger" : "bg-cinema-700"
                        )}
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full bg-white absolute top-1 transition-all",
                            item.value ? "left-6" : "left-1"
                          )}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          <Button
            variant="ghost"
            onClick={goBack}
            disabled={step === 1}
            className={step === 1 ? "invisible" : ""}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {step < TOTAL_STEPS ? (
            <Button onClick={goNext}>
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEdit ? "Saving…" : "Submitting…"}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {isEdit ? "Save Changes" : "Submit Survey"}
                </>
              )}
            </Button>
          )}
        </div>

        {error && (
          <p className="text-danger text-sm text-center mt-4">{error}</p>
        )}
      </main>
    </>
  );
}
