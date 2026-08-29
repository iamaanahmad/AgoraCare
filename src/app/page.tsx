import { FamilySwitcher } from '@/components/dashboard/family-switcher';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { TodaysSchedule } from '@/components/dashboard/todays-schedule';
import { AppLayout } from '@/components/layout/app-layout';

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <FamilySwitcher />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4">
            <TodaysSchedule />
          </div>
          <div className="col-span-4 lg:col-span-3">
            <QuickActions />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
