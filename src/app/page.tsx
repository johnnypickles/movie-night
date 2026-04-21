"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Film, Users, Sparkles, Ticket, Popcorn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";

const steps = [
  {
    num: "01",
    icon: Users,
    title: "Open the Lobby",
    description:
      "Start a room and send the ticket to your friends. No tickets at the door — it's on the house.",
  },
  {
    num: "02",
    icon: Ticket,
    title: "Cast Your Vote",
    description:
      "Each moviegoer fills out a short preference card. Mood, genre, era, dealbreakers — whatever you're feeling tonight.",
  },
  {
    num: "03",
    icon: Sparkles,
    title: "Lights, Camera —",
    description:
      "Our algorithm crunches the numbers and unrolls the perfect feature for the whole crew.",
  },
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* ─── Hero ─────────────────────────────────────────── */}
        <section className="relative">
          <div className="max-w-5xl mx-auto px-4 pt-16 pb-20 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Now showing banner */}
              <div className="inline-flex items-center gap-3 mb-8 px-4 py-2 bg-cinema-900 text-gold-500 border-2 border-cinema-900 font-condensed uppercase tracking-[0.3em] text-xs">
                <Popcorn className="w-3.5 h-3.5" />
                Now Showing
                <Popcorn className="w-3.5 h-3.5" />
              </div>

              <h1 className="marquee-title text-5xl sm:text-7xl md:text-8xl leading-[0.95] mb-2 tracking-wide">
                MOVIE
              </h1>
              <h1 className="marquee-title text-5xl sm:text-7xl md:text-8xl leading-[0.95] mb-8 tracking-wide">
                MATCH
              </h1>

              <div className="divider-stars max-w-md mx-auto mb-8 text-sm">
                <span className="px-2">★ ★ ★</span>
              </div>

              <p className="font-serif italic text-xl md:text-2xl text-cinema-800 max-w-2xl mx-auto mb-3">
                A double feature of indecision ends tonight.
              </p>
              <p className="font-typewriter text-sm text-cinema-700 max-w-xl mx-auto mb-10">
                Invite the crew → everyone answers a few questions → the
                projector picks the perfect picture.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/room/create">
                  <Button size="lg">
                    <Film className="w-5 h-5" />
                    Open the Box Office
                  </Button>
                </Link>
                <Link href="/room/join">
                  <Button variant="secondary" size="lg">
                    <Ticket className="w-5 h-5" />
                    I Have a Ticket
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─── How It Works ─────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <div className="font-condensed uppercase tracking-[0.3em] text-accent-500 text-sm mb-3">
              ·  Program  ·
            </div>
            <h2 className="font-marquee text-4xl sm:text-5xl text-cinema-900 mb-3">
              Tonight's Feature Presentation
            </h2>
            <p className="font-typewriter text-cinema-700 max-w-xl mx-auto">
              Three acts. Ten minutes. One movie everyone agrees on.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative"
              >
                <div className="bg-cinema-50 border-2 border-cinema-900 shadow-[6px_6px_0_var(--color-cinema-900)] p-8 h-full">
                  <div className="flex items-center justify-between mb-5">
                    <div className="font-marquee text-3xl text-accent-500">
                      {step.num}
                    </div>
                    <div className="w-12 h-12 bg-gold-500 border-2 border-cinema-900 flex items-center justify-center">
                      <step.icon
                        className="w-6 h-6 text-cinema-900"
                        strokeWidth={2.5}
                      />
                    </div>
                  </div>
                  <h3 className="font-condensed uppercase tracking-wider text-2xl text-cinema-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="font-serif text-cinema-700 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── Footer ───────────────────────────────────────── */}
        <footer className="mt-8 bg-cinema-900 text-cinema-200 border-t-2 border-cinema-900">
          <div className="max-w-5xl mx-auto px-4 py-8 text-center font-typewriter text-xs">
            <div className="font-condensed uppercase tracking-[0.3em] text-gold-500 mb-2">
              — The End —
            </div>
            <p>
              Movie data provided by TMDB. MovieMatch is not endorsed or
              certified by TMDB.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
