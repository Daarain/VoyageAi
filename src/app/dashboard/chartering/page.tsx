import { CharteringHub } from "@/components/dashboard/CharteringHub";
import { getCharteringRequests } from "@/lib/data-source";

export default async function CharteringPage() {
  const requests = await getCharteringRequests();
  return <CharteringHub requests={requests} />;
}
