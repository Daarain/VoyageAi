import { getIdleTimeEntries, getVessels } from "@/lib/data-source";
import { IdleTimeView } from "@/components/dashboard/IdleTimeView";

export default async function IdleTimePage() {
  const [idleEntries, vessels] = await Promise.all([getIdleTimeEntries(), getVessels()]);
  return <IdleTimeView idleEntries={idleEntries} vessels={vessels} />;
}
