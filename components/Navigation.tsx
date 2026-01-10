
import React from 'react';
import { AppScreen, UserProfile } from '../types';

import { supabase } from '../lib/supabase';

interface NavigationProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  user: UserProfile;
}

const Navigation: React.FC<NavigationProps> = ({ currentScreen, onNavigate, user }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const allNavItems = [
    { screen: AppScreen.DASHBOARD, label: 'Tổng quan', icon: 'dashboard', roles: ['admin', 'cashier', 'sales', 'baker'] },
    { screen: AppScreen.POS, label: 'Tạo đơn', icon: 'add_shopping_cart', roles: ['admin', 'cashier', 'sales'] },
    { screen: AppScreen.PRODUCTS, label: 'Sản phẩm', icon: 'bakery_dining', roles: ['admin', 'cashier', 'sales'] },
    { screen: AppScreen.DEBT, label: 'Công nợ', icon: 'account_balance_wallet', roles: ['admin', 'cashier', 'sales'] },
    { screen: AppScreen.SHIFTS, label: 'Ca làm', icon: 'schedule', roles: ['admin'] },
    { screen: AppScreen.REPORTS, label: 'Báo cáo', icon: 'bar_chart', roles: ['admin'] },
  ];



  if (!user) return null;

  const userRole = user.role || 'sales'; // Fallback to sales if role is missing
  const navItems = allNavItems.filter(item => item.roles.includes(userRole));

  const renderBottomNav = () => (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 z-50 px-4 py-2 flex justify-around items-end shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-3xl md:hidden">
      {navItems.map((item) => {
        const isActive = currentScreen === item.screen;

        // Special rendering for POS button in center
        if (item.screen === AppScreen.POS) {
          return (
            <button
              key={item.screen}
              onClick={() => onNavigate(item.screen)}
              className="relative -top-6 bg-primary text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 active:scale-95 transition-all border-4 border-background"
            >
              <span className="material-symbols-outlined text-[28px]">add</span>
            </button>
          );
        }

        return (
          <button
            key={item.screen}
            onClick={() => onNavigate(item.screen)}
            className={`flex flex-col items-center gap-1 min-w-[64px] transition-colors ${isActive ? 'text-primary' : 'text-gray-400'
              }`}
          >
            <span className={`material-symbols-outlined text-[24px] ${isActive ? 'fill-1' : ''}`}>
              {item.icon}
            </span>
            <span className={`text-[10px] font-semibold tracking-tight`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );

  const renderSidebar = () => (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-surface-dark flex items-center justify-center overflow-hidden border border-primary/20">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight">BINH MINH</h1>
          <p className="text-xs text-text-sub font-medium">Bakery Management</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => {
          const isActive = currentScreen === item.screen;

          if (item.screen === AppScreen.POS) {
            return (
              <button
                key={item.screen}
                onClick={() => onNavigate(item.screen)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-dark font-bold mb-4"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </div>
                <span className="text-sm">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.screen}
              onClick={() => onNavigate(item.screen)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <span className={`material-symbols-outlined text-[24px] ${isActive ? 'fill-1' : ''}`}>
                {item.icon}
              </span>
              <span className="text-sm font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-gray-50">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {user.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {user.full_name || 'Người dùng'}
            </p>
            <p className="text-xs text-gray-500 capitalize truncate">
              {user.role === 'admin' ? 'Quản lý' :
                user.role === 'cashier' ? 'Thu ngân' :
                  user.role === 'baker' ? 'Thợ bánh' : 'Nhân viên bán hàng'}
            </p>
          </div>
        </div>


        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="text-sm font-bold">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );

  const renderMobileHeader = () => (
    <div className="md:hidden w-full bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
          {user.full_name?.charAt(0) || 'U'}
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 leading-tight">
            {user.full_name || 'Người dùng'}
          </p>
          <p className="text-[10px] text-gray-500 font-medium capitalize">
            {user.role === 'admin' ? 'Quản lý' :
              user.role === 'cashier' ? 'Thu ngân' :
                user.role === 'baker' ? 'Thợ bánh' : 'Sales'}
          </p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="w-9 h-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">logout</span>
      </button>
    </div>
  );

  return (
    <>
      {renderMobileHeader()}
      {renderBottomNav()}
      {renderSidebar()}
    </>
  );
};

export default Navigation;
