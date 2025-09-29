import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vidluna Embed",
  description: "Embeddable HLS player with subtitles",
    generator: 'v0.app'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
