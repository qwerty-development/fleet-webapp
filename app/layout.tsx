import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "@/components/Providers";
import GuestModeHandler from "@/components/GuestModeHandler";
import { Suspense, useEffect } from "react";

const geistSans = localFont({
  src: "../public/fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../public/fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Fleet",
  description: "Your car marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
  // Check if we're on the error page with a 405 error
  if (window.location.pathname === '/auth/signin' &&
      window.location.search.includes('next=%2Fhome')) {
    // Detect if we have authentication cookies
    const hasAuthCookie = document.cookie.includes('sb-') ||
                          document.cookie.includes('supabase');

    if (hasAuthCookie) {
      console.log('Detected authentication cookies, redirecting to home');
      window.location.href = '/home';
    }
  }
}, []);
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Suspense fallback={<div>Loading...</div>}>
            <GuestModeHandler />
          </Suspense>
          {children}
        </Providers>
      </body>
    </html>
  );
}