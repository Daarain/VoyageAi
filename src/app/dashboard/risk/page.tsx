import { getRiskAlerts } from "@/lib/data-source";
import { RiskAlertsView } from "@/components/dashboard/RiskAlertsView";

export default async function RiskPage() {
  const alerts = await getRiskAlerts();
  return <RiskAlertsView alerts={alerts} />;
}
