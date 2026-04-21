"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Ticket, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useSession } from "@/hooks/use-session";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useSession();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }
    if (mode === "signup" && password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/signin";
    const body =
      mode === "signup"
        ? { email: email.trim(), password, name: name.trim() }
        : { email: email.trim(), password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }
      await refresh();
      router.push("/");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const isSignup = mode === "signup";

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
              <div className="font-condensed uppercase tracking-[0.3em] text-accent-500 text-xs mb-2">
                · Members Club ·
              </div>
              <div className="w-14 h-14 bg-gold-500 border-2 border-cinema-900 shadow-[3px_3px_0_var(--color-cinema-900)] flex items-center justify-center mx-auto mb-3">
                <Ticket className="w-7 h-7 text-cinema-900" strokeWidth={2.5} />
              </div>
              <CardTitle>{isSignup ? "Get Your Season Pass" : "Welcome Back"}</CardTitle>
              <CardDescription>
                {isSignup
                  ? "Save your ratings, make friends, and keep watching."
                  : "Sign in to pick up where you left off."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Tabs */}
              <div className="grid grid-cols-2 gap-2 mb-5 p-1 bg-cinema-100 border-2 border-cinema-900">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className={`py-2 font-condensed uppercase tracking-widest text-xs transition ${
                    mode === "signin"
                      ? "bg-cinema-900 text-gold-500"
                      : "text-cinema-800 hover:bg-cinema-200"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`py-2 font-condensed uppercase tracking-widest text-xs transition ${
                    mode === "signup"
                      ? "bg-cinema-900 text-gold-500"
                      : "text-cinema-800 hover:bg-cinema-200"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignup && (
                  <div>
                    <label className="block font-condensed uppercase tracking-widest text-xs text-cinema-800 mb-2">
                      Display Name (optional)
                    </label>
                    <Input
                      placeholder="What should we call you?"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>
                )}
                <div>
                  <label className="block font-condensed uppercase tracking-widest text-xs text-cinema-800 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block font-condensed uppercase tracking-widest text-xs text-cinema-800 mb-2">
                    Password{" "}
                    {isSignup && (
                      <span className="text-cinema-700/60 normal-case tracking-normal font-typewriter">
                        (8+ chars)
                      </span>
                    )}
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={
                      isSignup ? "new-password" : "current-password"
                    }
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
                      {isSignup ? "Stamping your pass…" : "Tearing ticket…"}
                    </>
                  ) : isSignup ? (
                    "Get My Pass"
                  ) : (
                    "Let Me In"
                  )}
                </Button>
              </form>

              <p className="font-typewriter text-xs text-cinema-700 text-center mt-4">
                {isSignup
                  ? "Already have an account? Click Sign In above."
                  : "New here? Click Sign Up above."}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </>
  );
}
