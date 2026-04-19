"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Search, X, Film, Users } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useSession } from "@/hooks/use-session";

type Mode = "DISCOVER" | "SHORTLIST";

interface SearchResult {
  id: number;
  title: string;
  year: string | null;
  posterPath: string | null;
  voteAverage: number;
}

interface Candidate {
  tmdbMovieId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
  voteAverage: number | null;
}

export default function CreateRoomPage() {
  const router = useRouter();
  const { user, refresh } = useSession();
  const [name, setName] = useState("");
  const [hostName, setHostName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [mode, setMode] = useState<Mode>("DISCOVER");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const searchAbort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (user?.name && !hostName) {
      setHostName(user.name);
    }
  }, [user, hostName]);

  useEffect(() => {
    if (mode !== "SHORTLIST" || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      searchAbort.current?.abort();
      const ctrl = new AbortController();
      searchAbort.current = ctrl;
      setSearching(true);
      try {
        const res = await fetch(
          `/api/movies/search?q=${encodeURIComponent(query.trim())}`,
          { signal: ctrl.signal }
        );
        if (!res.ok) return;
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        // aborted or failed
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, mode]);

  function addCandidate(r: SearchResult) {
    if (candidates.length >= 15) return;
    if (candidates.some((c) => c.tmdbMovieId === r.id)) return;
    setCandidates([
      ...candidates,
      {
        tmdbMovieId: r.id,
        title: r.title,
        posterPath: r.posterPath,
        releaseYear: r.year ? parseInt(r.year, 10) : null,
        voteAverage: r.voteAverage,
      },
    ]);
    setQuery("");
    setResults([]);
  }

  function removeCandidate(id: number) {
    setCandidates(candidates.filter((c) => c.tmdbMovieId !== id));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!hostName.trim()) {
      setError("Please enter your name");
      return;
    }
    if (mode === "SHORTLIST" && candidates.length < 2) {
      setError("Add at least 2 movies to the shortlist");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostName: hostName.trim(),
          roomName: name.trim() || undefined,
          mode,
          candidates: mode === "SHORTLIST" ? candidates : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create room");
      }

      const { code, hostId } = await res.json();
      localStorage.setItem(`room-${code}-userId`, hostId);
      await refresh();
      router.push(`/room/${code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-xl"
        >
          <Card>
            <CardHeader className="text-center">
              <div className="w-14 h-14 rounded-xl bg-accent-500/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-accent-400" />
              </div>
              <CardTitle className="text-2xl">Create a Room</CardTitle>
              <CardDescription>
                Start a movie night session for your group
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-cinema-300 mb-2">
                    Your Name *
                  </label>
                  <Input
                    placeholder="Enter your name"
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cinema-300 mb-2">
                    Room Name (optional)
                  </label>
                  <Input
                    placeholder="e.g., Friday Night Movies"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cinema-300 mb-2">
                    Picking Mode
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMode("DISCOVER")}
                      className={`rounded-xl border p-4 text-left transition ${
                        mode === "DISCOVER"
                          ? "border-accent-500 bg-accent-500/10"
                          : "border-cinema-700/50 hover:border-cinema-600"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-accent-400" />
                        <span className="font-semibold text-cinema-100">Discover</span>
                      </div>
                      <p className="text-xs text-cinema-400">
                        We'll find movies based on the group's survey answers.
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("SHORTLIST")}
                      className={`rounded-xl border p-4 text-left transition ${
                        mode === "SHORTLIST"
                          ? "border-accent-500 bg-accent-500/10"
                          : "border-cinema-700/50 hover:border-cinema-600"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Film className="w-4 h-4 text-accent-400" />
                        <span className="font-semibold text-cinema-100">Shortlist</span>
                      </div>
                      <p className="text-xs text-cinema-400">
                        Pick 2–15 movies; the group's answers decide which.
                      </p>
                    </button>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {mode === "SHORTLIST" && (
                    <motion.div
                      key="shortlist"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      <div>
                        <label className="block text-sm font-medium text-cinema-300 mb-2">
                          Shortlist{" "}
                          <span className="text-cinema-500">
                            ({candidates.length}/15)
                          </span>
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cinema-500 pointer-events-none" />
                          <Input
                            placeholder="Search for a movie…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-9"
                          />
                        </div>

                        {results.length > 0 && (
                          <div className="mt-2 rounded-xl border border-cinema-700/50 bg-cinema-900/80 max-h-64 overflow-y-auto">
                            {results.map((r) => (
                              <button
                                type="button"
                                key={r.id}
                                onClick={() => addCandidate(r)}
                                className="w-full flex items-center gap-3 p-2 hover:bg-cinema-800/60 text-left"
                              >
                                {r.posterPath ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={`https://image.tmdb.org/t/p/w92${r.posterPath}`}
                                    alt=""
                                    className="w-10 h-14 object-cover rounded"
                                  />
                                ) : (
                                  <div className="w-10 h-14 bg-cinema-800 rounded flex items-center justify-center">
                                    <Film className="w-4 h-4 text-cinema-600" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm text-cinema-100 truncate">
                                    {r.title}
                                  </div>
                                  <div className="text-xs text-cinema-500">
                                    {r.year || "—"}
                                    {r.voteAverage
                                      ? ` · ★ ${r.voteAverage.toFixed(1)}`
                                      : ""}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        {searching && (
                          <p className="text-xs text-cinema-500 mt-1">Searching…</p>
                        )}
                      </div>

                      {candidates.length > 0 && (
                        <ul className="space-y-2">
                          {candidates.map((c) => (
                            <li
                              key={c.tmdbMovieId}
                              className="flex items-center gap-3 rounded-lg border border-cinema-700/50 bg-cinema-900/50 p-2"
                            >
                              {c.posterPath ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={`https://image.tmdb.org/t/p/w92${c.posterPath}`}
                                  alt=""
                                  className="w-8 h-12 object-cover rounded"
                                />
                              ) : (
                                <div className="w-8 h-12 bg-cinema-800 rounded flex items-center justify-center">
                                  <Film className="w-3 h-3 text-cinema-600" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-cinema-100 truncate">
                                  {c.title}
                                </div>
                                <div className="text-xs text-cinema-500">
                                  {c.releaseYear || "—"}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeCandidate(c.tmdbMovieId)}
                                className="p-1 text-cinema-500 hover:text-danger"
                                aria-label={`Remove ${c.title}`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <p className="text-danger text-sm text-center">{error}</p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Users className="w-5 h-5" />
                      Create Room
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </>
  );
}
