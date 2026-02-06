import type { Metadata } from 'next'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

// ---------------- FONTS ----------------
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// ---------------- METADATA ----------------
export const metadata: Metadata = {
  title: {
    default: 'Your App Name',
    template: '%s | Your App Name',
  },
  description: 'AI-powered platform.',
}

// ---------------- LAYOUT ----------------
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
            ${geistSans.variable}
            ${geistMono.variable}
            antialiased
            bg-gray-950
            text-white
          `}
        >
          {/* HEADER */}
          <header className="flex justify-end items-center p-4 gap-4 h-16 border-b border-gray-800">
            <SignedOut>
              <SignInButton mode="modal" />
              <SignUpButton mode="modal">
                <button className="bg-[#6c47ff] hover:bg-[#5936d6] transition text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-5">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>

            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </header>

          {/* MAIN */}
          <main className="min-h-screen flex flex-col">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  )
}
