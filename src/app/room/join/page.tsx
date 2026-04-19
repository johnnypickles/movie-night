"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useSession } from "@/hooks/use-session";

export default function JoinRoomPage() {
  const router = useRouter();
  const { user, refresh } = useSession();
  const [code, setCode] = useState("");
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill name if user is logged in
  useEffect(() => {
    if (user?.name && !guestName) {
      setGuestName(user.name);
    }
  }, [user, guestName]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = guestName.trim();

    if (!trimmedCode) {
      setError("Please enter a room code");
      return;
    }
    if (!trimmedName) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/rooms/${trimmedCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestName: trimmedName }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to join room");
      }

      const { participantId } = data;
      // Save user ID for survey submission
      localStorage.setItem(`room-${trimmedCode}-userId`, participantId);
      // Refresh session so the header updates (cookie was set by the API)
      await refresh();
      router.push(`/room/${trimmedCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Auto-format: uppercase, allow letters, numbers, and dashes
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    setCode(val);
  }

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader className="text-center">
              <div className="w-14 h-14 rounded-xl bg-accent-500/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-accent-400" />
              </div>
              <CardTitle className="text-2xl">Join a Room</CardTitle>
              <CardDescription>
                Enter the room code shared by your host
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-cinema-300 mb-2">
                    Your Name *
                  </label>
                  <Input
                    placeholder="Enter your name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cinema-300 mb-2">
                    Room Code *
                  </label>
                  <Input
                    placeholder="e.g., MOVIE-7X3K"
                    value={code}
                    onChange={handleCodeChange}
                    className="text-center text-xl tracking-widest font-mono"
                    maxLength={12}
                  />
                </div>

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
                      Joining...
                    </>
                  ) : (
                    "Join Room"
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
