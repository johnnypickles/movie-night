"use client";

import Link from "next/link";
import { Film, History, Users, LogOut } from "lucide-react";
import { useSession } from "@/hooks/use-session";

export function Header() {
  const { user, logout } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-cinema-800/50 bg-cinema-950/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-accent-500 flex items-center justify-center group-hover:bg-accent-400 transition-colors">
            <Film className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-cinema-100">
            Movie Night
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/room/join"
            className="text-sm text-cinema-400 hover:text-cinema-200 transition-colors px-2 py-1.5 rounded-lg hover:bg-cinema-800/50"
          >
            Join
          </Link>
          <Link
            href="/room/create"
            className="text-sm text-cinema-400 hover:text-cinema-200 transition-colors px-2 py-1.5 rounded-lg hover:bg-cinema-800/50"
          >
            Create
          </Link>
          {user && (
            <>
              <Link
                href="/history"
                className="text-sm text-cinema-400 hover:text-cinema-200 transition-colors px-2 py-1.5 rounded-lg hover:bg-cinema-800/50"
                title="Watch History"
              >
                <History className="w-4 h-4 sm:hidden" />
                <span className="hidden sm:inline">History</span>
              </Link>
              <Link
                href="/profile"
                className="text-sm text-cinema-400 hover:text-cinema-200 transition-colors px-2 py-1.5 rounded-lg hover:bg-cinema-800/50"
                title="Profile & Friends"
              >
                <Users className="w-4 h-4 sm:hidden" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-cinema-700">
                <div className="w-7 h-7 rounded-full bg-accent-500/20 flex items-center justify-center text-xs font-bold text-accent-400">
                  {user.name?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <span className="text-sm text-cinema-300 hidden sm:inline max-w-[80px] truncate">
                  {user.name}
                </span>
                <button
                  onClick={logout}
                  className="text-cinema-500 hover:text-cinema-300 transition-colors cursor-pointer"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
          {!user && (
            <Link
              href="/login"
              className="text-sm bg-accent-500 text-white px-4 py-1.5 rounded-lg hover:bg-accent-400 transition-colors font-medium"
            >
              Log In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
