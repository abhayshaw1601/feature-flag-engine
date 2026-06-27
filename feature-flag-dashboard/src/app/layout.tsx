import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FlagProvider } from "@/components/FlagProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Real-Time Feature Management Console",
  description: "High-scale engineering panel platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-slate-950 text-slate-100`}>
        <FlagProvider>
          {children}
        </FlagProvider>
      </body>
    </html>
  );
}