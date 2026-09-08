import { getAuditLog } from "@/lib/data-source";
import { AuditLogView } from "@/components/dashboard/AuditLogView";

export default async function AuditLogPage() {
  const entries = await getAuditLog();
  return <AuditLogView entries={entries} />;
}
