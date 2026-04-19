"use client";

import { SessionContext, useSessionProvider } from "@/hooks/use-session";

export function Providers({ children }: { children: React.ReactNode }) {
  const session = useSessionProvider();

  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}
