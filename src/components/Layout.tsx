
import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { signOut } from '../services/auth.service';
import OfflineBanner from './OfflineBanner';
import ToastContainer from './ToastContainer';
import { APP_VERSION } from '../lib/version';
import { 
  HomeIcon, 
  ArrowsRightLeftIcon, 
  WalletIcon, 
  CheckBadgeIcon, 
  CalendarDaysIcon, 
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const SidebarLink = ({ to, icon: Icon, label, testId }: { to: string, icon: any, label: string, testId?: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      data-testid={testId}
      className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
        isActive 
          ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-700' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon className={`h-5 w-5 ml-3 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
      {label}
    </Link>
  );
};

const Layout: React.FC = () => {
  const { membership, session } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-100 flex-col">
      <OfflineBanner />
      <ToastContainer />
      
      <div className="flex flex-1">
        <aside className="w-64 bg-white border-l border-gray-200 hidden md:flex flex-col fixed inset-y-0 right-0 z-50 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-indigo-700 flex items-center">
              <div className="bg-indigo-600 p-1.5 rounded-lg ml-2">
                <WalletIcon className="h-6 w-6 text-white" />
              </div>
              <span>Cash & Custody</span>
            </h1>
            <p className="text-[10px] text-gray-400 mt-2 font-bold tracking-widest uppercase truncate">{membership?.company_name || 'جاري التحميل...'}</p>
          </div>

          <nav className="flex-1 py-4 overflow-y-auto">
            <SidebarLink to="/" icon={HomeIcon} label="لوحة التحكم" testId="nav-dashboard" />
            <SidebarLink to="/movements" icon={ArrowsRightLeftIcon} label="حركات الكاش" testId="nav-movements" />
            <SidebarLink to="/custody" icon={WalletIcon} label="إدارة العهد" testId="nav-custody" />
            <SidebarLink to="/approvals" icon={CheckBadgeIcon} label="الاعتمادات" testId="nav-approvals" />
            <SidebarLink to="/daily-close" icon={CalendarDaysIcon} label="الإقفال اليومي" testId="nav-daily-close" />
            <SidebarLink to="/reports" icon={ChartBarIcon} label="التقارير المالية" testId="nav-reports" />
            <SidebarLink to="/settings" icon={Cog6ToothIcon} label="الإعدادات" testId="nav-settings" />
          </nav>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center mb-4 px-2">
              <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                {session?.user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="mr-3 overflow-hidden">
                <p className="text-sm font-bold text-gray-900 truncate">{session?.user?.email}</p>
                <p className="text-[10px] text-indigo-600 font-bold uppercase">{membership?.role || 'User'}</p>
              </div>
            </div>
            <button 
              data-testid="nav-logout"
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-semibold"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 ml-2" />
              تسجيل الخروج
            </button>
            <div className="mt-4 text-[9px] text-gray-300 font-bold text-center border-t border-gray-100 pt-3 uppercase tracking-tighter">
              Cash & Custody — v{APP_VERSION}
            </div>
          </div>
        </aside>

        <main className="flex-1 md:pr-64">
          <header className="bg-white border-b border-gray-200 h-16 flex items-center px-8 sticky top-0 z-40 shadow-sm">
            <div className="flex-1">
               <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                  نظام إدارة السيولة النقدية
               </h2>
            </div>
          </header>

          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
