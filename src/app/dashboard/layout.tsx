import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { MobileNav } from "@/components/layout/MobileNav";
import { OnboardingTour } from "@/components/dashboard/OnboardingTour";
import { WorkflowProvider } from "@/lib/workflow-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkflowProvider>
      <div className="relative min-h-screen bg-void">
        <div className="pointer-events-none fixed inset-0 bg-grid-fade opacity-60" />
        <Sidebar />
        <div className="relative md:pl-64">
          <TopNav />
          <main className="min-h-[calc(100vh-4rem)] px-4 pb-24 pt-5 sm:px-6 md:pb-8">
            {children}
          </main>
        </div>
        <MobileNav />
        <OnboardingTour />
      </div>
    </WorkflowProvider>
  );
}

