import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
// 1. CHANGE: Import Inter instead of Poppins
import { Inter, Geist_Mono } from 'next/font/google' 
import './globals.css'

// 2. CHANGE: Configure Inter
const inter = Inter({
  variable: '--font-sans', // usage: var(--font-sans)
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Nutribot | AI Nutrition Assistant',
  description: 'A context-aware dietary assistant that customizes advice based on your biological profile (TDEE, Macros, Goals), and dietary preferences.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`
            ${inter.variable} 
            ${geistMono.variable}
            antialiased
            bg-background text-text-main
          `}
        >
          <main className="h-screen flex flex-col overflow-hidden">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  )
}