import { LiveAgentDashboard } from '@/components/dashboard/LiveAgentDashboard';
import { AppLayout } from '@/components/layout/app-layout';

export default function AgentPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <LiveAgentDashboard />
      </div>
    </AppLayout>
  );
}
