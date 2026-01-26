import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './hooks/useAuth';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Movements from './pages/Movements';
import NewMovement from './pages/NewMovement';
import MovementDetail from './pages/MovementDetail';
import CustodyPage from './pages/Custody';
import Approvals from './pages/Approvals';
import DailyClose from './pages/DailyClose';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Layout from './components/Layout';

const ProtectedRoute = () => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-500 font-medium">جاري التحقق من الصلاحيات...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

const AppContent: React.FC = () => {
  const { session } = useAuth();
  
  return (
    <Router>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" /> : <Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/movements" element={<Movements />} />
            <Route path="/movements/new" element={<NewMovement />} />
            <Route path="/movements/:id" element={<MovementDetail />} />
            <Route path="/custody" element={<CustodyPage />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/daily-close" element={<DailyClose />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;