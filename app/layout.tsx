import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import "./globals.css"

export const metadata: Metadata = {
  title: "FinTrack - Admin Dashboard",
  description:
    "Comprehensive admin dashboard for managing user transactions with advanced filtering, sorting, and pagination capabilities.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
