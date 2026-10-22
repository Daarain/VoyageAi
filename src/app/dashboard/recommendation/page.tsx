import { getRecommendation } from "@/lib/data-source";
import { RecommendationView } from "@/components/dashboard/RecommendationView";

export default async function RecommendationPage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string; taskId?: string }>;
}) {
  const params = await searchParams;
  const recommendation = await getRecommendation(params.scenario);
  return <RecommendationView recommendation={recommendation} />;
}

