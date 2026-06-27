import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "5S by ED",
  description: "Application de pilotage des audits 5S industriels",
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
