import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/ui/Sidebar";
import { ThemeProvider } from "@/components/ui/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Lume",
    template: "%s | Lume",
  },
  description: "Lume is a modern, open-source study app designed to help you learn efficiently and effectively. With a focus on spaced repetition, active recall, and personalized learning paths, Lume empowers students to master any subject with ease. Whether you're a high school student, college student, or lifelong learner, Lume provides the tools and resources you need to succeed. Join the Lume community today and take your learning to the next level.",
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