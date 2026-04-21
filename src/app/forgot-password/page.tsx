"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Loader2 } from "lucide-react";
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Enter your email");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }
      setSent(true);
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
                · Lost Your Ticket? ·
              </div>
              <div className="w-14 h-14 bg-gold-500 border-2 border-cinema-900 shadow-[3px_3px_0_var(--color-cinema-900)] flex items-center justify-center mx-auto mb-3">
                <Mail className="w-7 h-7 text-cinema-900" strokeWidth={2.5} />
              </div>
              <CardTitle>Reset Your Password</CardTitle>
              <CardDescription>
                Enter your email and we&apos;ll send you a reset link.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sent ? (
                <div className="text-center">
                  <p className="font-typewriter text-cinema-900 mb-3">
                    Check your email.
                  </p>
                  <p className="font-typewriter text-xs text-cinema-700">
                    If an account exists for <strong>{email}</strong>, a
                    reset link is on its way. It&apos;s good for 1 hour.
                  </p>
                  <Link
                    href="/login"
                    className="block mt-6 font-condensed uppercase tracking-widest text-xs text-accent-500 hover:text-accent-600"
                  >
                    ← Back to sign in
                  </Link>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
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
                        Sending…
                      </>
                    ) : (
                      "Send Reset Link"
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
