import type { Metadata } from "next"
import "./globals.css"

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
    <html lang="id">
      <body className="bg-gray-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
