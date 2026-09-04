import { LiveAgentDashboard } from '@/components/dashboard/LiveAgentDashboard';

export default function AgentPage() {
  return (
    <div className="flex min-h-screen w-full bg-slate-50 dark:bg-slate-950 p-4 md:p-8 overflow-y-auto">
      <div className="mx-auto w-full max-w-7xl">
        <LiveAgentDashboard />
      </div>
    </div>
  );
}
