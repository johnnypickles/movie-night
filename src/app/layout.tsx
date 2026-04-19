import type { Metadata } from "next";
import { Providers } from "@/components/layout/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Movie Night - Find the Perfect Movie for Your Group",
  description:
    "Can't decide what to watch? Create a room, invite your friends, and let our algorithm find the perfect movie for everyone.",
  openGraph: {
    title: "Movie Night - Find the Perfect Movie for Your Group",
    description:
      "Can't decide what to watch? Create a room, invite your friends, and let our algorithm find the perfect movie for everyone.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="film-grain min-h-screen antialiased">
        <Providers>
          <div className="relative min-h-screen flex flex-col">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
