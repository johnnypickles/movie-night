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
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRoomEvents } from "@/hooks/use-room-events";

export default function RoomLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();
  const { roomState, connected, recommendationsReady } = useRoomEvents(code);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // Navigate to results when ready
  useEffect(() => {
    if (recommendationsReady || roomState?.status === "RESULTS") {
      router.push(`/room/${code}/results`);
    }
  }, [recommendationsReady, roomState?.status, code, router]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
    }
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

  return (
    <>
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Room Code Display */}
          <div className="text-center mb-10">
            <p className="text-sm text-cinema-400 mb-3">
              Share this code with your group
            </p>
            <button
              onClick={copyCode}
              className="inline-flex items-center gap-3 bg-cinema-800 border-2 border-cinema-600 rounded-2xl px-8 py-4 hover:border-accent-500/50 transition-colors group cursor-pointer"
            >
              <span className="text-3xl md:text-4xl font-mono font-bold tracking-[0.25em] text-accent-400">
                {code}
              </span>
              {copied ? (
                <Check className="w-6 h-6 text-success" />
              ) : (
                <Copy className="w-6 h-6 text-cinema-400 group-hover:text-cinema-200 transition-colors" />
              )}
            </button>
            {copied && (
              <p className="text-success text-sm mt-2">Copied to clipboard!</p>
            )}
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-success" : "bg-cinema-500"
              }`}
            />
            <span className="text-xs text-cinema-400">
              {connected ? "Live updates active" : "Connecting..."}
            </span>
          </div>

          {/* Participants */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-cinema-400" />
                <h2 className="font-semibold text-cinema-200">
                  Participants ({participants.length})
                </h2>
              </div>

              {participants.length === 0 ? (
                <p className="text-cinema-500 text-center py-6">
                  Waiting for people to join...
                </p>
              ) : (
                <div className="space-y-3">
                  {participants.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-cinema-700 flex items-center justify-center text-sm font-bold text-cinema-300">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-cinema-200">
                          {p.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.surveyCompleted ? (
                          <span className="flex items-center gap-1 text-success text-sm">
                            <CheckCircle2 className="w-4 h-4" />
                            Done
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-cinema-500 text-sm">
                            <Circle className="w-4 h-4" />
                            Waiting
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Survey Progress */}
          {participants.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between text-sm text-cinema-400 mb-2">
                <span>Survey Progress</span>
                <span>
                  {surveyCount} / {participants.length} complete
                </span>
              </div>
              <div className="h-3 bg-cinema-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent-500 to-accent-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(surveyCount / participants.length) * 100}%`,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              size="lg"
              className="w-full"
              variant="secondary"
              onClick={() => router.push(`/room/${code}/survey`)}
            >
              Take Survey
              <ArrowRight className="w-5 h-5" />
            </Button>

            {allSurveysDone && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleGenerateRecommendations}
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Finding your perfect movie...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Find Our Movie!
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {error && (
              <p className="text-danger text-sm text-center">{error}</p>
            )}
          </div>
        </motion.div>
      </main>
    </>
  );
}
