import { FamilySwitcher } from '@/components/dashboard/family-switcher';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { TodaysSchedule } from '@/components/dashboard/todays-schedule';
import { AppLayout } from '@/components/layout/app-layout';

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-both">
          <FamilySwitcher />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="col-span-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-both">
            <TodaysSchedule />
          </div>
          <div className="col-span-4 lg:col-span-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
            <QuickActions />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
