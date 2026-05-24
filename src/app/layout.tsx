import type { Metadata } from "next"
import "./globals.css"
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "RemiSense AI",
  description: "AI Recommendation Assistant untuk permainan kartu Remi",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={cn("font-sans", geist.variable)}>
      <body className="bg-gray-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
