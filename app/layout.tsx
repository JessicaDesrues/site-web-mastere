import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nuit Rouge — Une nouvelle intensité",
  description:
    "Nuit Rouge, une nouvelle signature olfactive. Rendez-vous le 20 décembre 2026.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
