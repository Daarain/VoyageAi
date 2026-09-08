import { OptimizingPipelineView } from "@/components/dashboard/OptimizingPipelineView";

export default async function OptimizingPage({
  searchParams,
}: {
  searchParams: Promise<{ taskId?: string }>;
}) {
  const params = await searchParams;
  return <OptimizingPipelineView taskId={params.taskId} />;
}
