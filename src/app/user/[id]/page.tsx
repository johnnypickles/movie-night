"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Film, Star, Loader2, UserPlus, Check } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";

interface FriendRating {
  tmdbMovieId: number;
  rating: number;
  comment: string | null;
  updatedAt: string;
  title: string | null;
  posterPath: string | null;
}

interface FriendUser {
  id: string;
  name: string | null;
  image: string | null;
}

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user: me, loading: sessionLoading } = useSession();

  const [friend, setFriend] = useState<FriendUser | null>(null);
  const [ratings, setRatings] = useState<FriendRating[]>([]);
  const [isFriend, setIsFriend] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addedOk, setAddedOk] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionLoading && !me) {
      router.push(`/login?next=/user/${id}`);
    }
  }, [me, sessionLoading, router, id]);

  async function loadProfile() {
    try {
      const res = await fetch(`/api/users/${id}/ratings`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load");
        setLoading(false);
        return;
      }
      setFriend(data.user);
      setRatings(data.ratings);
      setIsFriend(Boolean(data.isFriend));
      setIsSelf(Boolean(data.isSelf));
      setLoading(false);
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!me || !id) return;
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, id]);

  async function sendRequest() {
    setAdding(true);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId: id }),
      });
      if (res.ok) {
        setAddedOk(true);
        await loadProfile();
      }
    } finally {
      setAdding(false);
    }
  }

  if (sessionLoading || loading) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-accent-500" />
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-12">
          <Button variant="ghost" onClick={() => router.push("/profile")}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="bg-cinema-50 border-2 border-cinema-900 shadow-[6px_6px_0_var(--color-cinema-900)] p-8 text-center mt-6">
            <p className="font-typewriter text-cinema-900">{error}</p>
          </div>
        </main>
      </>
    );
  }

  const avg =
    ratings.length > 0
      ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
      : null;

  return (
    <>
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="text-center mt-6 mb-8">
            <div className="font-condensed uppercase tracking-[0.3em] text-accent-500 text-xs mb-2">
              · Critic's Corner ·
            </div>
            <div className="w-20 h-20 mx-auto bg-gold-500 border-2 border-cinema-900 shadow-[4px_4px_0_var(--color-cinema-900)] flex items-center justify-center text-3xl font-condensed text-cinema-900 mb-3">
              {friend?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <h1 className="font-marquee text-3xl md:text-4xl text-cinema-900">
              {friend?.name || "Unknown"}
            </h1>
            {(isFriend || isSelf) && (
              <p className="font-typewriter text-sm text-cinema-800 mt-2">
                {ratings.length}{" "}
                {ratings.length === 1 ? "rating" : "ratings"}
                {avg !== null && ` · avg ★ ${avg.toFixed(1)}/10`}
              </p>
            )}

            {!isFriend && !isSelf && (
              <div className="mt-6">
                {addedOk ? (
                  <p className="font-typewriter text-success inline-flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Friends! Their ratings will appear here soon.
                  </p>
                ) : (
                  <Button onClick={sendRequest} disabled={adding}>
                    {adding ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adding…
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Add as Friend
                      </>
                    )}
                  </Button>
                )}
                <p className="font-typewriter text-xs text-cinema-800 mt-3">
                  You need to be friends to see ratings.
                </p>
              </div>
            )}
          </div>

          {(isFriend || isSelf) && ratings.length === 0 && (
            <div className="bg-cinema-50 border-2 border-cinema-900 shadow-[6px_6px_0_var(--color-cinema-900)] p-10 text-center">
              <Film
                className="w-10 h-10 mx-auto mb-3 text-cinema-700"
                strokeWidth={1.5}
              />
              <p className="font-typewriter text-cinema-900">
                No ratings yet.
              </p>
            </div>
          )}

          {(isFriend || isSelf) && ratings.length > 0 && (
            <ul className="space-y-3">
              {ratings.map((r) => (
                <li
                  key={r.tmdbMovieId}
                  className="bg-cinema-50 border-2 border-cinema-900 shadow-[4px_4px_0_var(--color-cinema-900)] p-3 flex gap-3"
                >
                  {r.posterPath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://image.tmdb.org/t/p/w154${r.posterPath}`}
                      alt=""
                      className="w-16 h-24 object-cover border-2 border-cinema-900 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-24 bg-cinema-100 border-2 border-cinema-900 flex items-center justify-center flex-shrink-0">
                      <Film
                        className="w-6 h-6 text-cinema-700"
                        strokeWidth={1.5}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-condensed uppercase tracking-wide text-cinema-900 text-lg truncate">
                        {r.title || `TMDB #${r.tmdbMovieId}`}
                      </h3>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Star
                          className="w-4 h-4 text-gold-500"
                          fill="currentColor"
                        />
                        <span className="font-condensed text-cinema-900">
                          {r.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    {r.comment && (
                      <p className="font-serif italic text-sm text-cinema-900 leading-snug">
                        &ldquo;{r.comment}&rdquo;
                      </p>
                    )}
                    <p className="font-typewriter text-xs text-cinema-800 mt-1">
                      {new Date(r.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </main>
    </>
  );
}
