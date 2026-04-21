"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  Check,
  Users,
  CheckCircle2,
  Circle,
  Sparkles,
  Loader2,
  ArrowRight,
  Share2,
  Link as LinkIcon,
  Pencil,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { useRoomEvents } from "@/hooks/use-room-events";

export default function RoomLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();
  const { roomState, connected, recommendationsReady } = useRoomEvents(code);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUserId(localStorage.getItem(`room-${code}-userId`));
    // Fetch room metadata (name) once.
    fetch(`/api/rooms/${code}`)
      .then((r) => r.json())
      .then((d) => setRoomName(d?.name ?? null))
      .catch(() => {});
  }, [code]);

  useEffect(() => {
    if (recommendationsReady || roomState?.status === "RESULTS") {
      router.push(`/room/${code}/results`);
    }
  }, [recommendationsReady, roomState?.status, code, router]);

  function getRoomUrl() {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/room/join?code=${code}`;
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // ignore
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(getRoomUrl());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // ignore
    }
  }

  async function shareLink() {
    const url = getRoomUrl();
    const shareData = {
      title: "MovieMatch",
      text: `Join my MovieMatch room — code ${code}`,
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user cancelled or share failed → fall through to copy
      }
    }
    await copyLink();
  }

  async function handleGenerateRecommendations() {
    setGenerating(true);
    setError("");

    try {
      const res = await fetch(`/api/rooms/${code}/recommend`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate recommendations");
      }

      router.push(`/room/${code}/results`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setGenerating(false);
    }
  }

  const participants = roomState?.participants ?? [];
  const allSurveysDone =
    participants.length > 0 && participants.every((p) => p.surveyCompleted);
  const surveyCount = participants.filter((p) => p.surveyCompleted).length;

  const me = participants.find((p) => p.userId === currentUserId);
  const mySurveyDone = Boolean(me?.surveyCompleted);

  return (
    <>
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* ─── Ticket header ─── */}
          <div className="text-center mb-4">
            <div className="font-condensed uppercase tracking-[0.3em] text-accent-500 text-xs mb-2">
              · Admit One ·
            </div>
            <h1 className="font-marquee text-4xl md:text-5xl text-cinema-900 mb-2">
              {roomName || "MovieMatch"}
            </h1>
            <p className="font-typewriter text-sm text-cinema-700">
              Share the ticket. Seat the crew. Start the show.
            </p>
          </div>

          {/* ─── Room code box ─── */}
          <div className="marquee-border mt-10 mb-6 text-center">
            <p className="font-condensed uppercase tracking-widest text-xs text-cinema-700 mb-1">
              Room Code
            </p>
            <button
              onClick={copyCode}
              className="font-marquee text-4xl md:text-5xl text-accent-500 tracking-[0.2em] inline-flex items-center gap-3 cursor-pointer hover:text-accent-600 transition-colors"
              aria-label="Copy code"
            >
              {code}
              {copiedCode ? (
                <Check className="w-6 h-6 text-success" />
              ) : (
                <Copy className="w-5 h-5 text-cinema-700" />
              )}
            </button>
            {copiedCode && (
              <p className="font-typewriter text-xs text-success mt-1">
                Code copied!
              </p>
            )}
          </div>

          {/* ─── Share buttons ─── */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <Button variant="secondary" onClick={shareLink} className="w-full">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button variant="outline" onClick={copyLink} className="w-full">
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4" />
                  Copy Link
                </>
              )}
            </Button>
          </div>

          {/* ─── Connection status ─── */}
          <div className="flex items-center justify-center gap-2 mb-6 font-typewriter text-xs text-cinema-700">
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-success" : "bg-cinema-600"
              }`}
            />
            <span>
              {connected ? "Live updates active" : "Connecting…"}
            </span>
          </div>

          {/* ─── Participants card ─── */}
          <div className="bg-cinema-50 border-2 border-cinema-900 shadow-[6px_6px_0_var(--color-cinema-900)] p-6 mb-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-dashed border-cinema-800/40">
              <Users className="w-5 h-5 text-cinema-900" strokeWidth={2.5} />
              <h2 className="font-condensed uppercase tracking-wider text-xl text-cinema-900">
                The Guest List ({participants.length})
              </h2>
            </div>

            {participants.length === 0 ? (
              <p className="font-typewriter text-cinema-700 text-center py-6">
                Waiting for people to join…
              </p>
            ) : (
              <div className="space-y-2">
                {participants.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gold-500 border-2 border-cinema-900 flex items-center justify-center text-sm font-bold text-cinema-900 font-condensed">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-serif text-cinema-900">
                        {p.name}
                      </span>
                    </div>
                    {p.surveyCompleted ? (
                      <span className="flex items-center gap-1 text-success font-condensed uppercase tracking-widest text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        Seated
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-cinema-700 font-condensed uppercase tracking-widest text-xs">
                        <Circle className="w-4 h-4" />
                        At the Bar
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* ─── Progress ─── */}
          {participants.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between font-condensed uppercase tracking-widest text-xs text-cinema-800 mb-2">
                <span>Preference Cards</span>
                <span>
                  {surveyCount} / {participants.length} Filled
                </span>
              </div>
              <div className="h-4 bg-cinema-100 border-2 border-cinema-900 overflow-hidden">
                <motion.div
                  className="h-full bg-accent-500 border-r-2 border-cinema-900"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(surveyCount / participants.length) * 100}%`,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          {/* ─── Action buttons ─── */}
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full"
              variant={mySurveyDone ? "secondary" : "default"}
              onClick={() => router.push(`/room/${code}/survey`)}
            >
              {mySurveyDone ? (
                <>
                  <Pencil className="w-5 h-5" />
                  Edit My Answers
                </>
              ) : (
                <>
                  Fill Out Your Card
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>

            {allSurveysDone && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Button
                  size="lg"
                  variant="gold"
                  className="w-full"
                  onClick={handleGenerateRecommendations}
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading the Reel…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Roll the Film!
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {error && (
              <p className="font-typewriter text-danger text-sm text-center">
                {error}
              </p>
            )}
          </div>
        </motion.div>
      </main>
    </>
  );
}
