import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "QueryForge | SQL Interview & Engineering Arena",
  description: "Think Like an Engineer. Query Like a Hacker. 250-Question Validated SQL Problem Solving Platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable} dark`}>
      <body className="min-h-screen bg-[#080B0A] font-sans text-[#E6F2EA] antialiased">
        {children}
      </body>
    </html>
  );
}
