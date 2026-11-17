import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"], display: "swap", variable: "--font-inter" });
const nunito = Nunito({ subsets: ["latin", "latin-ext"], weight: ["400", "600", "700", "800"], display: "swap", variable: "--font-nunito" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.AUTH_URL || "https://kleiderpfad.nehmer.org"),
  title: { default: "Kleidolino", template: "%s | Kleidolino" },
  description: "Kinderkleidung gemeinsam verwalten, liebevoll weitergeben und ihren Weg verfolgen.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kleidolino",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#245440",
} as const;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${inter.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
