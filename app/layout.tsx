import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/ui/Sidebar";
import { ThemeProvider } from "@/components/ui/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Lume | The Ultimate Study App",
    template: "%s | Lume",
  },
  description: "Lume is a comprehensive study app designed to enhance your learning experience. With features like flashcards, vocabulary arsenal, notes, focus timer, and more, Lume helps you study smarter and achieve your academic goals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-300 min-h-screen`}>
        <ThemeProvider>
          <div className="flex min-h-screen relative">
            {/* Fixed Sidebar */}
            <Sidebar />
            
            {/* Main Content Area - Handles desktop sidebar offset cleanly */}
            <div className="flex-1 w-full md:pl-64 pt-16 md:pt-0 min-h-screen transition-all">
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}