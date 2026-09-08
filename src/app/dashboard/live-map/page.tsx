import { CommandCenter } from "@/components/dashboard/CommandCenter";
import { getActiveRoute, getMarketInsights, getForecast } from "@/lib/data-source";

export default async function LiveMapPage() {
  const [route, market, forecast] = await Promise.all([
    getActiveRoute(),
    getMarketInsights(),
    getForecast(),
  ]);

  return <CommandCenter route={route} market={market} forecast={forecast} />;
}
