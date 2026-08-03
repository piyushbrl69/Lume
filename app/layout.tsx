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
  description: "Lume is a comprehensive study app designed to enhance your learning experience. With features like flashcards, vocabulary arsenal, notes, focus timer, and more, Lume helps you study smarter and achieve your academic goals. Whether you're a student or a lifelong learner, Lume provides the tools you need to succeed. Start your learning journey today and unlock your full potential with Lume.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Moved the background and text color classes directly to the body tag */}
      <body className={`${inter.className} bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-300`}>
        <ThemeProvider>
          <div className="flex min-h-screen">
            {/* Fixed Sidebar */}
            <Sidebar />
            
            {/* Main Content Area */}
            <div className="flex-1 ml-64 min-h-screen">
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}