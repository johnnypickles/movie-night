"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Loader2 } from "lucide-react";
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { refresh } = useSession();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("This reset link is missing its token. Request a new one.");
    }
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }
      setDone(true);
      await refresh();
      setTimeout(() => router.push("/"), 1500);
    } catch {
      setError("Network error");
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
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader className="text-center">
              <div className="font-condensed uppercase tracking-[0.3em] text-accent-500 text-xs mb-2">
                · New Password ·
              </div>
              <div className="w-14 h-14 bg-gold-500 border-2 border-cinema-900 shadow-[3px_3px_0_var(--color-cinema-900)] flex items-center justify-center mx-auto mb-3">
                <Lock className="w-7 h-7 text-cinema-900" strokeWidth={2.5} />
              </div>
              <CardTitle>Choose a New Password</CardTitle>
              <CardDescription>
                Make it something you&apos;ll remember.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {done ? (
                <p className="font-typewriter text-center text-cinema-900">
                  Password updated. Redirecting…
                </p>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className="block font-condensed uppercase tracking-widest text-xs text-cinema-800 mb-2">
                      New Password{" "}
                      <span className="text-cinema-700/60 normal-case tracking-normal font-typewriter">
                        (8+ chars)
                      </span>
                    </label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block font-condensed uppercase tracking-widest text-xs text-cinema-800 mb-2">
                      Confirm
                    </label>
                    <Input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
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
                    disabled={loading || !token}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      "Set New Password"
                    )}
                  </Button>

                  <Link
                    href="/login"
                    className="block text-center font-condensed uppercase tracking-widest text-xs text-cinema-700 hover:text-accent-500"
                  >
                    ← Back to sign in
                  </Link>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </>
  );
}
