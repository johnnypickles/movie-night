"use client";

import Link from "next/link";
import { History, Users, Ticket } from "lucide-react";
import { useSession } from "@/hooks/use-session";

export function Header() {
  const { user, logout } = useSession();

  return (
    <header className="sticky top-0 z-50 bg-cinema-50 border-b-2 border-cinema-900">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-accent-500 border-2 border-cinema-900 shadow-[2px_2px_0_var(--color-cinema-900)] flex items-center justify-center group-hover:bg-accent-400 transition-colors">
            <Ticket className="w-5 h-5 text-cinema-50" strokeWidth={2.5} />
          </div>
          <span
            className="font-marquee text-xl sm:text-2xl text-cinema-900 leading-none"
            style={{ letterSpacing: "0.02em" }}
          >
            MovieMatch
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3 font-condensed uppercase tracking-widest text-xs sm:text-sm">
          <Link
            href="/room/join"
            className="text-cinema-800 hover:text-accent-500 transition-colors px-2 py-1.5"
          >
            Join
          </Link>
          <Link
            href="/room/create"
            className="text-cinema-800 hover:text-accent-500 transition-colors px-2 py-1.5"
          >
            Create
          </Link>
          {user && (
            <>
              <Link
                href="/history"
                className="text-cinema-800 hover:text-accent-500 transition-colors px-2 py-1.5"
                title="Watch History"
              >
                <History className="w-4 h-4 sm:hidden" />
                <span className="hidden sm:inline">History</span>
              </Link>
              <Link
                href="/profile"
                className="text-cinema-800 hover:text-accent-500 transition-colors px-2 py-1.5"
                title="Profile"
              >
                <Users className="w-4 h-4 sm:hidden" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
              <div className="flex items-center gap-2 ml-2 pl-3 border-l-2 border-cinema-900">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover border-2 border-cinema-900"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gold-500 border-2 border-cinema-900 flex items-center justify-center text-xs font-bold text-cinema-900 font-condensed">
                    {user.name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                )}
                <span className="text-cinema-900 hidden sm:inline max-w-[80px] truncate font-serif normal-case tracking-normal">
                  {user.name}
                </span>
                <button
                  onClick={logout}
                  className="text-cinema-700 hover:text-accent-500 transition-colors cursor-pointer font-condensed uppercase tracking-widest text-xs px-2 py-1"
                >
                  Log Out
                </button>
              </div>
            </>
          )}
          {!user && (
            <Link
              href="/login"
              className="bg-accent-500 text-cinema-50 px-4 py-2 border-2 border-cinema-900 shadow-[2px_2px_0_var(--color-cinema-900)] hover:bg-accent-400 transition-colors"
            >
              Log In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
