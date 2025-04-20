import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "./providers"
import Link from "next/link"
import { LanguageSwitcher } from "@/components/language-switcher"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Republic of Bean",
  description: "The country of HOPE",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Providers>
            <main className="min-h-screen bg-background flex flex-col">
              <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-primary/20">
                <div className="container mx-auto py-2 px-4">
                  <div className="flex items-center justify-between">
                    <Link href="/" className="font-bold text-lg neon-text">
                      Republic of Bean
                    </Link>
                    <div className="flex items-center gap-4">
                      <LanguageSwitcher />
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-16 px-4 container mx-auto flex-grow">{children}</div>
            </main>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
