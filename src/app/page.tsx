"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Film, Users, Sparkles, ArrowRight, Popcorn, Clapperboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";

const steps = [
  {
    icon: Users,
    title: "Create a Room",
    description: "Start a movie night session and share the room code with your group.",
  },
  {
    icon: Clapperboard,
    title: "Take the Survey",
    description: "Each person answers a quick survey about their mood and movie preferences.",
  },
  {
    icon: Sparkles,
    title: "Get Matched",
    description: "Our algorithm finds the perfect movie that everyone will enjoy.",
  },
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-cinema-800/20 via-cinema-950 to-cinema-950" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent-500/5 rounded-full blur-3xl" />

          <div className="relative max-w-5xl mx-auto px-4 pt-20 pb-24 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-cinema-800/60 border border-cinema-700/50 rounded-full px-4 py-2 mb-8">
                <Popcorn className="w-4 h-4 text-accent-400" />
                <span className="text-sm text-cinema-300">
                  End the &quot;what should we watch?&quot; debate forever
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
                <span className="text-cinema-100">Find the </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-accent-300">
                  Perfect Movie
                </span>
                <br />
                <span className="text-cinema-100">for Your Group</span>
              </h1>

              <p className="text-lg md:text-xl text-cinema-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                Everyone fills a quick survey on their phone. Our algorithm
                crunches the preferences and picks a movie the whole group will
                love.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/room/create">
                  <Button size="lg" className="text-lg px-10">
                    <Film className="w-5 h-5" />
                    Create a Room
                  </Button>
                </Link>
                <Link href="/room/join">
                  <Button variant="outline" size="lg" className="text-lg px-10">
                    Join a Room
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-5xl mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-center text-cinema-100 mb-4">
              How It Works
            </h2>
            <p className="text-cinema-400 text-center mb-12 max-w-lg mx-auto">
              Three simple steps to the perfect movie night
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
                className="relative group"
              >
                <div className="rounded-2xl border border-cinema-700/50 bg-cinema-900/50 p-8 text-center hover:border-accent-500/30 hover:bg-cinema-900/80 transition-all duration-300">
                  <div className="w-14 h-14 rounded-xl bg-accent-500/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-accent-500/20 transition-colors">
                    <step.icon className="w-7 h-7 text-accent-400" />
                  </div>
                  <div className="text-sm font-semibold text-accent-400 mb-2">
                    Step {i + 1}
                  </div>
                  <h3 className="text-xl font-bold text-cinema-100 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-cinema-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-cinema-800/50 py-8">
          <div className="max-w-5xl mx-auto px-4 text-center text-sm text-cinema-500">
            <p>Movie data provided by TMDB. Movie Night is not endorsed or certified by TMDB.</p>
          </div>
        </footer>
      </main>
    </>
  );
}
