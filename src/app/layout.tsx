import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "KleiderPfad", description: "Kleine Kleidung. Große Geschichten.", manifest: "/manifest.webmanifest" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="de"><body>{children}</body></html>; }
