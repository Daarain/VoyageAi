import { getVessels } from "@/lib/data-source";
import { VesselIntelligenceView } from "@/components/dashboard/VesselIntelligenceView";

export default async function VesselsPage() {
  const vessels = await getVessels();
  return <VesselIntelligenceView vessels={vessels} />;
}
