"use client";

import { motion } from "framer-motion";
import { FileText, Download, TrendingUp, PiggyBank, Ship } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { KPICard } from "@/components/ui/KPICard";
import { useChartTheme } from "@/lib/use-chart-theme";
import { useToast } from "@/lib/toast-context";
import { jsPDF } from "jspdf";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const monthlySavings = [
  { month: "Apr", savings: 320000 },
  { month: "May", savings: 410000 },
  { month: "Jun", savings: 280000 },
  { month: "Jul", savings: 520000 },
  { month: "Aug", savings: 1480000 },
];

const reports = [
  { name: "Q3 Savings Summary", date: "2026-08-15", type: "PDF" },
  { name: "Vessel Utilization Report", date: "2026-08-10", type: "PDF" },
  { name: "Contract Comparison Log", date: "2026-08-05", type: "CSV" },
  { name: "Risk Incident History", date: "2026-07-28", type: "PDF" },
];

function downloadBlob(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const chart = useChartTheme();
  const showToast = useToast();

  function downloadCsv() {
    const rows = [["Report", "Date", "Format"], ...reports.map((report) => [report.name, report.date, report.type])];
    const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n");
    downloadBlob(csv, "voyageai-reports.csv", "text/csv;charset=utf-8");
    showToast("CSV report downloaded.");
  }

  function downloadPdf() {
    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.text("VoyageAI Pro | Q3 Savings Summary", 20, 22);
    pdf.setFontSize(10);
    pdf.text("Generated from the currently displayed local report data", 20, 30);
    monthlySavings.forEach((entry, index) => pdf.text(`${entry.month}: $${entry.savings.toLocaleString()}`, 20, 44 + index * 8));
    pdf.save("voyageai-q3-savings-summary.pdf");
    showToast("PDF report downloaded.");
  }
  return (
    <div className="mx-auto max-w-[1400px]">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold tracking-tight">Reports &amp; Analytics</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Cost savings summaries, decision audit trails, and exportable performance reports
        </p>
      </motion.div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard label="YTD Savings" value="$3.01M" icon={PiggyBank} accent="teal" index={0} />
        <KPICard label="Voyages Analyzed" value="42" icon={Ship} accent="cyan" index={1} />
        <KPICard label="Avg. Savings Rate" value="11.4%" icon={TrendingUp} accent="amber" index={2} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="lg:col-span-2"
        >
          <GlassPanel className="p-5 sm:p-6">
            <div className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-ink-dim">
              Monthly Savings Trend
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <BarChart data={monthlySavings} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke={chart.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: chart.axisText, fontSize: 11 }}
                    axisLine={{ stroke: chart.grid }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: chart.axisText, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v / 1000}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: chart.tooltipBg,
                      border: `1px solid ${chart.tooltipBorder}`,
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => `$${v.toLocaleString()}`}
                    labelStyle={{ color: chart.tooltipLabel }}
                  />
                  <Bar dataKey="savings" radius={[6, 6, 0, 0]} fill="#2DD4BF" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassPanel>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <GlassPanel className="p-5">
            <div className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-ink-dim">
              Exportable Reports
            </div>
            <div className="flex flex-col gap-2.5">
              {reports.map((r) => (
                <div
                  key={r.name}
                  className="flex items-center justify-between rounded-xl bg-panel-raised/50 p-3"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText size={15} className="text-cyan-glow" />
                    <div>
                      <div className="text-xs font-semibold">{r.name}</div>
                      <div className="text-[10px] text-ink-dim">{r.date}</div>
                    </div>
                  </div>
                  <button onClick={r.type === "CSV" ? downloadCsv : downloadPdf} aria-label={`Download ${r.name}`} className="rounded-lg p-1.5 text-ink-muted hover:bg-panel-hover hover:text-ink-primary">
                    <Download size={14} />
                  </button>
                </div>
              ))}
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </div>
  );
}
