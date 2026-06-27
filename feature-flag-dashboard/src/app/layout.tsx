import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Feature Flag Control Center",
  description: "Manage and monitor application feature toggles in real-time.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
