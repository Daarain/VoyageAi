import { HomeNav } from "@/components/home/HomeNav";
import { MaritimeHero } from "@/components/home/MaritimeHero";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VoyageAI Pro | Forecast Freight. Charter Smarter.",
  description: "AI-powered freight forecasting and vessel chartering intelligence for bulk cargo operations.",
};

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-void">
      <HomeNav />
      <MaritimeHero />
    </div>
  );
}
