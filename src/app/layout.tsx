import type { Metadata } from "next";
import { Limelight, Playfair_Display, Special_Elite, Bebas_Neue } from "next/font/google";
import { Providers } from "@/components/layout/providers";
import "./globals.css";

const limelight = Limelight({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-marquee",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const specialElite = Special_Elite({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-typewriter",
  display: "swap",
});

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-condensed",
  display: "swap",
});

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
    <html
      lang="en"
      className={`${limelight.variable} ${playfair.variable} ${specialElite.variable} ${bebas.variable}`}
    >
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
