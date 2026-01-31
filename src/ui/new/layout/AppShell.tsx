import { Outlet } from 'react-router-dom';
import { BottomNav } from '@/ui/new/layout/BottomNav';

export function AppShell() {
  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
