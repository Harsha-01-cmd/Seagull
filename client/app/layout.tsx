import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Seagull - AI Powered Job Portal",
  description: "Find Your Dream Engineering Job with Smart Resume Analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-gray-50`} suppressHydrationWarning>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
