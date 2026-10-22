import { WhichVesselView } from "@/components/dashboard/WhichVesselView";
import { getActiveRoute, getForecast, getMarketInsights, getVesselClassOptions } from "@/lib/data-source";

export default async function WhichVesselPage() {
  const [options, route, forecast, market] = await Promise.all([
    getVesselClassOptions(),
    getActiveRoute(),
    getForecast(),
    getMarketInsights(),
  ]);
  return <WhichVesselView options={options} route={route} forecast={forecast} market={market} />;
}