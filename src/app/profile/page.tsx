"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Users, Search, UserPlus, X, Film, Star, Loader2 } from "lucide-react";
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
          <Loader2 className="w-8 h-8 animate-spin text-cinema-400" />
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
          {/* Profile Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-full bg-accent-500/20 flex items-center justify-center mx-auto mb-4 text-3xl font-bold text-accent-400">
              {user.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <h1 className="text-3xl font-bold text-cinema-100">{user.name}</h1>
            <p className="text-cinema-400 text-sm mt-1">
              Member since {new Date().toLocaleDateString()}
            </p>
          </div>

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
                  <div className="text-2xl font-bold text-cinema-100">{stat.value}</div>
                  <div className="text-xs text-cinema-400">{stat.label}</div>
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cinema-500" />
                <Input
                  placeholder="Search for friends by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                {searchQuery.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-cinema-800 border border-cinema-700 rounded-xl overflow-hidden shadow-2xl z-10 max-h-48 overflow-y-auto">
                    {searching ? (
                      <div className="p-3 text-center text-cinema-400 text-sm">
                        Searching...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-3 text-center text-cinema-500 text-sm">
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
                            <div className="w-8 h-8 rounded-full bg-cinema-600 flex items-center justify-center text-xs font-bold text-cinema-200">
                              {result.name?.charAt(0).toUpperCase() ?? "?"}
                            </div>
                            <span className="text-sm text-cinema-200">{result.name}</span>
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
                <p className="text-cinema-500 text-center py-4 text-sm">
                  No friends yet. Search above to add friends who use Movie Night!
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
                        <div className="w-10 h-10 rounded-full bg-cinema-700 flex items-center justify-center text-sm font-bold text-cinema-300 flex-shrink-0">
                          {friend.name?.charAt(0).toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-cinema-200 truncate">
                            {friend.name}
                          </div>
                          <div className="text-xs text-cinema-500">
                            View their ratings →
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => removeFriend(friend.friendshipId)}
                        className="text-cinema-500 hover:text-danger transition-colors cursor-pointer p-1 flex-shrink-0 ml-2"
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

          {/* Your ID (for sharing with friends) */}
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-cinema-500 text-center">
                Your User ID: <span className="font-mono text-cinema-400">{user.id}</span>
                <br />
                Share this with friends so they can find you!
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </>
  );
}
