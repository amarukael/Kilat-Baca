import type { Metadata } from "next";
import { Raleway, Comfortaa } from "next/font/google";
import "./globals.css";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const comfortaa = Comfortaa({
  variable: "--font-comfortaa",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Kilat Baca",
  description: "Kilat Baca — aplikasi pembelajaran visual interaktif",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${raleway.variable} ${comfortaa.variable}`}>
      <body style={{ fontFamily: "var(--font-raleway), sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
