import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/ThemeProvider";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "RemiSense",
  description: "Recommendation Assistant untuk permainan kartu Remi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body className="bg-background flex min-h-screen flex-col antialiased">
        <ThemeProvider>
          <main className="flex-1">{children}</main>
          <footer className="border-t py-3 text-center text-xs text-muted-foreground">
            <p>Dibuat oleh ratamaadhi</p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
