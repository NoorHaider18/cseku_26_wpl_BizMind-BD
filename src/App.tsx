import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Layout, NavItem } from './components/Layout.tsx';
import { AuthView } from './components/AuthView.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { SalesView } from './components/SalesView.tsx';
import { ProductsView } from './components/ProductsView.tsx';
import { InventoryView } from './components/InventoryView.tsx';
import { SuppliersView } from './components/SuppliersView.tsx';
import { ProcurementView } from './components/ProcurementView.tsx';
import { ExpensesView } from './components/ExpensesView.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { ForecastView } from './components/ForecastView.tsx';
import { AlertsView } from './components/AlertsView.tsx';
import { RecommendationsView } from './components/RecommendationsView.tsx';
import { AiAssistantView } from './components/AiAssistantView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { CustomersView } from './components/CustomersView.tsx';
import { AdminView } from './components/AdminView.tsx';
import { api } from './services/api.ts';
import { RefreshCw } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavItem>('dashboard');
  const [activeAlertCount, setActiveAlertCount] = useState<number>(0);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAlertCount();
    }
  }, [currentTab, user]);

  async function fetchAlertCount() {
    try {
      const alerts = await api.getAlerts();
      const unresolved = alerts.filter((a: any) => !a.is_resolved).length;
      setActiveAlertCount(unresolved);
    } catch {
      // Fallback
    }
  }

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-emerald-600/30 animate-pulse">
            BM
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              BizMind <span className="text-emerald-400">BD</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Starting enterprise workspace...</p>
          </div>
          <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mt-2" />
        </div>
      </div>
    );
  }

  // If not logged in: display Login and Profile Creation Portal
  if (!user) {
    return <AuthView onSuccess={() => setCurrentTab('dashboard')} />;
  }

  function renderView() {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView onNavigate={setCurrentTab} />;
      case 'sales':
        return <SalesView />;
      case 'products':
        return <ProductsView />;
      case 'inventory':
        return <InventoryView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'customers':
        return <CustomersView />;
      case 'procurement':
        return <ProcurementView />;
      case 'expenses':
        return <ExpensesView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'forecast':
        return <ForecastView onNavigate={setCurrentTab} />;
      case 'alerts':
        return <AlertsView onNavigate={setCurrentTab} />;
      case 'recommendations':
        return <RecommendationsView onNavigate={setCurrentTab} />;
      case 'ai-assistant':
        return <AiAssistantView onNavigate={setCurrentTab} />;
      case 'admin':
        return <AdminView />;
      case 'settings':
        return <SettingsView onOpenProfile={() => setIsProfileModalOpen(true)} />;
      default:
        return <DashboardView onNavigate={setCurrentTab} />;
    }
  }

  return (
    <>
      <Layout
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeAlertCount={activeAlertCount}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      >
        {renderView()}
      </Layout>

      {/* Global Profile & Business Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
