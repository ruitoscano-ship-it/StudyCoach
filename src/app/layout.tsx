import type { Metadata } from "next";
import { ViewTransition } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  themeColor: "#ff6b4a",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Coach de Estudo",
  description:
    "Notas, trabalhos de casa, plano de estudos e dificuldades para o 1.º ao 9.º ano.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Coach de Estudo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-PT"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-slate-900">
        <AuthSessionProvider>
          <ViewTransition
            enter={{
              "nav-forward": "nav-forward",
              "nav-back": "nav-back",
              default: "route-enter",
            }}
            exit={{
              "nav-forward": "nav-forward",
              "nav-back": "nav-back",
              default: "route-exit",
            }}
            default="route-fade"
          >
            {children}
          </ViewTransition>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
