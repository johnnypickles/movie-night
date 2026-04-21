"use client";

import Link from "next/link";
import { useState } from "react";
import { History, Users, Ticket, Menu, X } from "lucide-react";
import { useSession } from "@/hooks/use-session";

export function Header() {
  const { user, logout } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-cinema-50 border-b-2 border-cinema-900">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-3 group min-w-0"
          onClick={closeMenu}
        >
          <div className="w-10 h-10 shrink-0 bg-accent-500 border-2 border-cinema-900 shadow-[2px_2px_0_var(--color-cinema-900)] flex items-center justify-center group-hover:bg-accent-400 transition-colors">
            <Ticket className="w-5 h-5 text-cinema-50" strokeWidth={2.5} />
          </div>
          <span
            className="font-marquee text-xl sm:text-2xl text-cinema-900 leading-none truncate"
            style={{ letterSpacing: "0.02em" }}
          >
            MovieMatch
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-3 font-condensed uppercase tracking-widest text-sm">
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
              >
                History
              </Link>
              <Link
                href="/profile"
                className="text-cinema-800 hover:text-accent-500 transition-colors px-2 py-1.5"
              >
                Profile
              </Link>
              <div className="flex items-center gap-2 ml-1 pl-3 border-l-2 border-cinema-900">
                <Link href="/profile" className="flex items-center gap-2">
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
                  <span className="text-cinema-900 hidden lg:inline max-w-[100px] truncate font-serif normal-case tracking-normal">
                    {user.name}
                  </span>
                </Link>
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

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-cinema-900 hover:text-accent-500"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Menu"
        >
          {menuOpen ? (
            <X className="w-6 h-6" strokeWidth={2.5} />
          ) : (
            <Menu className="w-6 h-6" strokeWidth={2.5} />
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden border-t-2 border-cinema-900 bg-cinema-50">
          <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1 font-condensed uppercase tracking-widest text-sm">
            {user && (
              <Link
                href="/profile"
                onClick={closeMenu}
                className="flex items-center gap-3 py-2 text-cinema-900"
              >
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover border-2 border-cinema-900"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gold-500 border-2 border-cinema-900 flex items-center justify-center text-sm font-bold text-cinema-900 font-condensed">
                    {user.name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                )}
                <span className="font-serif normal-case tracking-normal text-cinema-900 truncate">
                  {user.name}
                </span>
              </Link>
            )}
            <Link
              href="/room/join"
              onClick={closeMenu}
              className="py-3 border-t border-dashed border-cinema-800/30 text-cinema-800 hover:text-accent-500 flex items-center gap-3"
            >
              <Ticket className="w-4 h-4" />
              Join a Room
            </Link>
            <Link
              href="/room/create"
              onClick={closeMenu}
              className="py-3 border-t border-dashed border-cinema-800/30 text-cinema-800 hover:text-accent-500 flex items-center gap-3"
            >
              <Ticket className="w-4 h-4" />
              Create a Room
            </Link>
            {user && (
              <>
                <Link
                  href="/history"
                  onClick={closeMenu}
                  className="py-3 border-t border-dashed border-cinema-800/30 text-cinema-800 hover:text-accent-500 flex items-center gap-3"
                >
                  <History className="w-4 h-4" />
                  History
                </Link>
                <Link
                  href="/profile"
                  onClick={closeMenu}
                  className="py-3 border-t border-dashed border-cinema-800/30 text-cinema-800 hover:text-accent-500 flex items-center gap-3"
                >
                  <Users className="w-4 h-4" />
                  Profile
                </Link>
                <button
                  onClick={() => {
                    closeMenu();
                    logout();
                  }}
                  className="py-3 border-t border-dashed border-cinema-800/30 text-accent-500 hover:text-accent-600 text-left"
                >
                  Log Out
                </button>
              </>
            )}
            {!user && (
              <Link
                href="/login"
                onClick={closeMenu}
                className="mt-2 bg-accent-500 text-cinema-50 px-4 py-3 border-2 border-cinema-900 shadow-[2px_2px_0_var(--color-cinema-900)] text-center"
              >
                Log In
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
