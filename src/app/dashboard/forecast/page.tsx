import { getForecast } from "@/lib/data-source";
import { ForecastView } from "@/components/dashboard/ForecastView";

export default async function ForecastPage() {
  const forecast = await getForecast();
  return <ForecastView forecast={forecast} />;
}
