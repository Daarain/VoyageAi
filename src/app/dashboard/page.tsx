import { CommandCenterOverview } from "@/components/dashboard/CommandCenterOverview";
import {
  getDashboardKpis,
  getMarketInsights,
  getRiskAlerts,
  getCharteringRequests,
} from "@/lib/data-source";

export default async function DashboardPage() {
  const [kpis, market, alerts, requests] = await Promise.all([
    getDashboardKpis(),
    getMarketInsights(),
    getRiskAlerts(),
    getCharteringRequests(),
  ]);

  return (
    <CommandCenterOverview kpis={kpis} market={market} alerts={alerts} requests={requests} />
  );
}
