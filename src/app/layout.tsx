import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

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
    <html lang="en">
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
