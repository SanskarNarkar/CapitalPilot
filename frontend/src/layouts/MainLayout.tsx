import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { NotificationDrawer } from '../components/NotificationDrawer';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
      <NotificationDrawer />
    </div>
  );
};
