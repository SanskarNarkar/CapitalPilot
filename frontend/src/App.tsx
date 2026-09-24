import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { MainLayout } from './layouts/MainLayout';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Challenge } from './pages/Challenge';
import { TradingPlan } from './pages/TradingPlan';
import { Trades } from './pages/Trades';
import { RiskManagement } from './pages/RiskManagement';
import { Setups } from './pages/Setups';
import { Analytics } from './pages/Analytics';
import { Scenarios } from './pages/Scenarios';
import { MarketContext } from './pages/MarketContext';
import { News } from './pages/News';
import { AICoach } from './pages/AICoach';
import { DhanSync } from './pages/DhanSync';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center text-slate-400 font-mono text-xs">
        Loading CapitalPilot...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Application Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="challenge" element={<Challenge />} />
              <Route path="trading-plan" element={<TradingPlan />} />
              <Route path="trades" element={<Trades />} />
              <Route path="risk" element={<RiskManagement />} />
              <Route path="setups" element={<Setups />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="scenarios" element={<Scenarios />} />
              <Route path="market" element={<MarketContext />} />
              <Route path="news" element={<News />} />
              <Route path="coach" element={<AICoach />} />
              <Route path="dhan" element={<DhanSync />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
