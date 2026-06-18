import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: 'swap' });

export const metadata: Metadata = {
  title: "StudyArena",
  description: "Telegram Web App for Learning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <AuthProvider>
          <div className="app-container">
            <div className="content-area">
              {children}
            </div>
            <BottomNav />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
