import { getPorts } from "@/lib/data-source";
import { PortIntelligenceView } from "@/components/dashboard/PortIntelligenceView";

export default async function PortsPage() {
  const ports = await getPorts();
  return <PortIntelligenceView ports={ports} />;
}
