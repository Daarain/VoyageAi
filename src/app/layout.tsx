import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { SessionProvider } from "@/lib/session-context";
import { ToastProvider } from "@/lib/toast-context";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  metadataBase: new URL("https://voyageai.pro"),
  title: "VoyageAI Pro | Freight Forecasting & Vessel Chartering Intelligence",
  description:
    "AI-powered freight forecasting and vessel chartering intelligence for bulk cargo operations.",
  openGraph: {
    title: "VoyageAI Pro | Freight Forecasting & Vessel Chartering Intelligence",
    description: "AI-powered freight forecasting and vessel chartering intelligence for bulk cargo operations.",
    type: "website",
    images: ["/images/hero-poster.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "VoyageAI Pro | Freight Forecasting & Vessel Chartering Intelligence",
    description: "AI-powered freight forecasting and vessel chartering intelligence for bulk cargo operations.",
    images: ["/images/hero-poster.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetBrainsMono.variable} font-sans bg-void text-ink-primary antialiased`}>
        <ThemeProvider>
          <SessionProvider>
            <ToastProvider>{children}</ToastProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
