"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Users, Search, UserPlus, X, Film, Star, Loader2, Pencil, Check } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useSession } from "@/hooks/use-session";
import { useRouter } from "next/navigation";

interface Friend {
  friendshipId: string;
  id: string;
  name: string | null;
  image: string | null;
  since: string;
}

interface UserResult {
  id: string;
  name: string | null;
  image: string | null;
}

export default function ProfilePage() {
  const { user, loading: sessionLoading } = useSession();
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [stats, setStats] = useState({ watched: 0, rated: 0, rooms: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [friendLoading, setFriendLoading] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !user) {
      router.push("/login");
    }
  }, [user, sessionLoading, router]);

  // Fetch friends
  useEffect(() => {
    if (!user) return;
    fetch("/api/friends")
      .then((r) => r.json())
      .then((data) => setFriends(data.friends || []))
      .catch(() => {});
  }, [user]);

  // Fetch stats
  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch("/api/history").then((r) => r.json()),
      fetch("/api/ratings").then((r) => r.json()),
    ])
      .then(([historyData, ratingsData]) => {
        setStats({
          watched: historyData.history?.length || 0,
          rated: ratingsData.ratings?.length || 0,
          rooms: 0,
        });
      })
      .catch(() => {});
  }, [user]);

  // Search users for adding friends
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        // Filter out existing friends
        const friendIds = new Set(friends.map((f) => f.id));
        setSearchResults((data.users || []).filter((u: UserResult) => !friendIds.has(u.id)));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, friends]);

  async function addFriend(friendId: string) {
    setFriendLoading(true);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId }),
      });
      if (res.ok) {
        // Refresh friends list
        const friendsRes = await fetch("/api/friends");
        const data = await friendsRes.json();
        setFriends(data.friends || []);
        setSearchQuery("");
        setSearchResults([]);
      }
    } catch {
      // ignore
    } finally {
      setFriendLoading(false);
    }
  }

  async function removeFriend(friendshipId: string) {
    try {
      await fetch("/api/friends", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId }),
      });
      setFriends((prev) => prev.filter((f) => f.friendshipId !== friendshipId));
    } catch {
      // ignore
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
          {/* Profile Header — editable */}
          <ProfileHeader
            user={user}
            onUpdated={async () => {
              // refresh session so header + this page pick up changes
              await fetch("/api/auth/session").then(() => {});
              window.location.reload();
            }}
          />


          {/* My Ratings (visible to friends via /user/[id]) */}
          <MyRatings userId={user.id} />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { icon: Film, label: "Watched", value: stats.watched },
              { icon: Star, label: "Rated", value: stats.rated },
              { icon: Users, label: "Friends", value: friends.length },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4 text-center">
                  <stat.icon className="w-5 h-5 text-accent-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-cinema-900">{stat.value}</div>
                  <div className="text-xs text-cinema-700">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Friends Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-accent-400" />
                Friends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search to add friends */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cinema-700" />
                <Input
                  placeholder="Search for friends by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-cinema-800 border border-cinema-700 rounded-xl overflow-hidden shadow-2xl z-10 max-h-48 overflow-y-auto">
                    {searching ? (
                      <div className="p-3 text-center text-cinema-700 text-sm">
                        Searching...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-3 text-center text-cinema-700 text-sm">
                        No users found
                      </div>
                    ) : (
                      searchResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => addFriend(result.id)}
                          disabled={friendLoading}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-cinema-700 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-cinema-600 flex items-center justify-center text-xs font-bold text-cinema-900">
                              {result.name?.charAt(0).toUpperCase() ?? "?"}
                            </div>
                            <span className="text-sm text-cinema-900">{result.name}</span>
                          </div>
                          <UserPlus className="w-4 h-4 text-accent-400" />
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Friends list */}
              {friends.length === 0 ? (
                <p className="text-cinema-700 text-center py-4 text-sm">
                  No friends yet. Search above to add friends who use MovieMatch!
                </p>
              ) : (
                <div className="space-y-3">
                  {friends.map((friend) => (
                    <div
                      key={friend.friendshipId}
                      className="flex items-center justify-between py-2"
                    >
                      <button
                        onClick={() => router.push(`/user/${friend.id}`)}
                        className="flex items-center gap-3 text-left cursor-pointer hover:opacity-80 transition-opacity flex-1 min-w-0"
                      >
                        <div className="w-10 h-10 rounded-full bg-cinema-700 flex items-center justify-center text-sm font-bold text-cinema-800 flex-shrink-0">
                          {friend.name?.charAt(0).toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-cinema-900 truncate">
                            {friend.name}
                          </div>
                          <div className="text-xs text-cinema-700">
                            View their ratings →
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => removeFriend(friend.friendshipId)}
                        className="text-cinema-700 hover:text-danger transition-colors cursor-pointer p-1 flex-shrink-0 ml-2"
                        title="Remove friend"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Share your profile link */}
          <ShareProfileCard userId={user.id} />
        </motion.div>
      </main>
    </>
  );
}

function ShareProfileCard({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/user/${userId}`
      : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Add me on MovieMatch",
          text: "Add me as a friend on MovieMatch",
          url,
        });
        return;
      } catch {
        // cancelled
      }
    }
    copy();
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-center mb-3">
          <div className="font-condensed uppercase tracking-[0.3em] text-accent-500 text-xs mb-1">
            · Your Profile Link ·
          </div>
          <p className="font-typewriter text-xs text-cinema-800">
            Send this to friends so they can add you.
          </p>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <Input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="text-xs"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="secondary" onClick={copy}>
            {copied ? "Copied!" : "Copy Link"}
          </Button>
          <Button size="sm" onClick={share}>
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface ProfileHeaderProps {
  user: { id: string; name: string | null; image: string | null };
  onUpdated: () => void | Promise<void>;
}

function ProfileHeader({ user, onUpdated }: ProfileHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name ?? "");
  const [image, setImage] = useState<string | null>(user.image ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setError("Image must be under 20MB");
      return;
    }
    try {
      const resized = await resizeImage(file, 512, 0.85);
      setImage(resized);
      setError("");
    } catch {
      setError("Couldn't read that image. Try a different one.");
    }
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), image }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Save failed");
        setSaving(false);
        return;
      }
      setEditing(false);
      await onUpdated();
    } catch {
      setError("Network error");
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="text-center mb-10">
        <div className="relative inline-block mb-4">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt=""
              className="w-24 h-24 rounded-full object-cover border-2 border-cinema-900 shadow-[3px_3px_0_var(--color-cinema-900)]"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-accent-500/20 flex items-center justify-center text-3xl font-bold text-accent-500 border-2 border-cinema-900 shadow-[3px_3px_0_var(--color-cinema-900)]">
              {user.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
          )}
        </div>
        <h1
          className="font-marquee text-3xl"
          style={{ color: "var(--color-cinema-900)" }}
        >
          {user.name || "Anonymous"}
        </h1>
        <button
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1 font-typewriter text-xs text-cinema-700 hover:text-accent-500 mt-2"
        >
          <Pencil className="w-3 h-3" />
          Edit Profile
        </button>
      </div>
    );
  }

  return (
    <div className="text-center mb-10 bg-cinema-50 border-2 border-cinema-900 shadow-[6px_6px_0_var(--color-cinema-900)] p-6">
      <div className="font-condensed uppercase tracking-[0.3em] text-accent-500 text-xs mb-3">
        · Edit Profile ·
      </div>

      <label
        htmlFor="avatar-upload"
        className="relative inline-block mb-4 cursor-pointer group"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            className="w-24 h-24 rounded-full object-cover border-2 border-cinema-900 shadow-[3px_3px_0_var(--color-cinema-900)]"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-accent-500/20 flex items-center justify-center text-3xl font-bold text-accent-500 border-2 border-cinema-900">
            {name?.charAt(0).toUpperCase() || "?"}
          </div>
        )}
        <div className="absolute inset-0 rounded-full bg-cinema-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <Pencil className="w-5 h-5 text-cinema-50" />
        </div>
      </label>
      <input
        id="avatar-upload"
        type="file"
        accept="image/*"
        onChange={onFile}
        className="hidden"
      />
      {image && (
        <button
          type="button"
          onClick={() => setImage(null)}
          className="block mx-auto font-typewriter text-xs text-cinema-700 hover:text-accent-500 mb-3"
        >
          Remove photo
        </button>
      )}

      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Display name"
        className="max-w-xs mx-auto text-center"
        maxLength={40}
      />

      {error && (
        <p className="font-typewriter text-danger text-sm mt-2">{error}</p>
      )}

      <div className="flex gap-2 justify-center mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditing(false);
            setName(user.name ?? "");
            setImage(user.image ?? null);
            setError("");
          }}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button size="sm" onClick={save} disabled={saving || !name.trim()}>
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Resize any image to a square max `size` px, exported as JPEG data URI.
// Uses createImageBitmap (handles HEIC on Safari/iOS) with URL.createObjectURL fallback.
async function resizeImage(
  file: File,
  size: number,
  quality: number
): Promise<string> {
  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, size / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");
  ctx.drawImage(bitmap, 0, 0, w, h);
  // Safari sometimes returns a ReadableStream-backed ImageBitmap; release it.
  if ("close" in bitmap) (bitmap as ImageBitmap).close?.();
  return canvas.toDataURL("image/jpeg", quality);
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // fall through to <img>
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image decode failed"));
    };
    img.src = url;
  });
}

interface MyRating {
  tmdbMovieId: number;
  rating: number;
  comment: string | null;
  updatedAt: string;
  title: string | null;
  posterPath: string | null;
}

function MyRatings({ userId }: { userId: string }) {
  const [ratings, setRatings] = useState<MyRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch(`/api/users/${userId}/ratings`)
      .then((r) => r.json())
      .then((d) => setRatings(d.ratings || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return null;
  if (ratings.length === 0) {
    return (
      <Card className="mb-8">
        <CardContent className="p-5 text-center">
          <div className="font-condensed uppercase tracking-[0.3em] text-accent-500 text-xs mb-1">
            · My Ratings ·
          </div>
          <p className="font-typewriter text-sm text-cinema-800">
            No ratings yet. Rate a movie on the History page or after a movie
            night.
          </p>
        </CardContent>
      </Card>
    );
  }

  const shown = expanded ? ratings : ratings.slice(0, 3);
  const avg =
    ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;

  return (
    <Card className="mb-8">
      <CardContent className="p-5">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="font-condensed uppercase tracking-[0.3em] text-accent-500 text-xs">
              · My Ratings ·
            </div>
            <p className="font-typewriter text-xs text-cinema-800 mt-0.5">
              {ratings.length} rated · avg ★ {avg.toFixed(1)}/10 · friends
              can see this
            </p>
          </div>
        </div>

        <ul className="space-y-2">
          {shown.map((r) => (
            <li
              key={r.tmdbMovieId}
              className="flex gap-3 border-t border-dashed border-cinema-800/30 pt-2 first:border-t-0 first:pt-0"
            >
              {r.posterPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`https://image.tmdb.org/t/p/w92${r.posterPath}`}
                  alt=""
                  className="w-10 h-14 object-cover border border-cinema-900 flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-14 bg-cinema-100 border border-cinema-900 flex items-center justify-center flex-shrink-0">
                  <Film className="w-4 h-4 text-cinema-700" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-condensed uppercase tracking-wide text-cinema-900 text-sm truncate">
                    {r.title || `TMDB #${r.tmdbMovieId}`}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star
                      className="w-3.5 h-3.5 text-gold-500"
                      fill="currentColor"
                    />
                    <span className="font-condensed text-cinema-900 text-sm">
                      {r.rating}
                    </span>
                  </div>
                </div>
                {r.comment && (
                  <p className="font-serif italic text-xs text-cinema-800 leading-snug mt-0.5">
                    &ldquo;{r.comment}&rdquo;
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>

        {ratings.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="block mx-auto mt-3 font-condensed uppercase tracking-widest text-xs text-accent-500 hover:text-accent-600"
          >
            {expanded ? "Show less" : `Show all ${ratings.length}`}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

