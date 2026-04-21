"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Ticket, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useSession } from "@/hooks/use-session";

export default function JoinRoomPage() {
  return (
    <Suspense fallback={null}>
      <JoinRoomPageInner />
    </Suspense>
  );
}

function JoinRoomPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refresh } = useSession();
  const [code, setCode] = useState("");
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill code from URL (?code=XXX) for shared links
  useEffect(() => {
    const urlCode = searchParams.get("code");
    if (urlCode && !code) {
      setCode(urlCode.toUpperCase());
    }
  }, [searchParams, code]);

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
      localStorage.setItem(`room-${trimmedCode}-userId`, participantId);
      await refresh();
      router.push(`/room/${trimmedCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
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
              <div className="inline-flex items-center gap-2 mb-2 font-condensed uppercase tracking-[0.3em] text-accent-500 text-xs justify-center">
                · Will Call ·
              </div>
              <div className="w-14 h-14 bg-gold-500 border-2 border-cinema-900 shadow-[3px_3px_0_var(--color-cinema-900)] flex items-center justify-center mx-auto mb-3">
                <Ticket
                  className="w-7 h-7 text-cinema-900"
                  strokeWidth={2.5}
                />
              </div>
              <CardTitle>Pick Up Your Ticket</CardTitle>
              <CardDescription>
                Got a code from a friend? Enter it below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="block font-condensed uppercase tracking-widest text-xs text-cinema-800 mb-2">
                    Your Name *
                  </label>
                  <Input
                    placeholder="Your name on the marquee"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block font-condensed uppercase tracking-widest text-xs text-cinema-800 mb-2">
                    Room Code *
                  </label>
                  <Input
                    placeholder="FLICK-XXXX"
                    value={code}
                    onChange={handleCodeChange}
                    className="text-center text-xl tracking-[0.2em] font-marquee text-accent-500"
                    maxLength={12}
                  />
                </div>

                {error && (
                  <p className="font-typewriter text-danger text-sm text-center">
                    {error}
                  </p>
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
                      Taking Your Seat…
                    </>
                  ) : (
                    "Take My Seat"
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
