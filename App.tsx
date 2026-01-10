
import React, { useState, useEffect } from 'react';
import { AppScreen, UserProfile } from './types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Shifts from './pages/Shifts';
import Products from './pages/Products';
import Debt from './pages/Debt';
import POS from './pages/POS';
import Reports from './pages/Reports';
import Navigation from './components/Navigation';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.LOGIN);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id, session.user.email!);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id, session.user.email!);
      } else {
        setUser(null);
        setCurrentScreen(AppScreen.LOGIN);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setUser({ ...data, email });
      } else {
        // Fallback if profile doesn't exist yet (race condition with trigger)
        setUser({ id: userId, email, full_name: 'Nhân viên Sales', role: 'sales' });
      }

      setCurrentScreen(AppScreen.DASHBOARD);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case AppScreen.LOGIN:
        return <Login onLogin={() => { }} />; // Login handled by auth listener
      case AppScreen.DASHBOARD:
        return <Dashboard onNavigate={setCurrentScreen} />;
      case AppScreen.SHIFTS:
        return <Shifts />;
      case AppScreen.PRODUCTS:
        return <Products user={user} />;
      case AppScreen.DEBT:
        return <Debt />;
      case AppScreen.POS:
        return <POS />;
      case AppScreen.REPORTS:
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const showNav = currentScreen !== AppScreen.LOGIN && user;

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-background shadow-2xl overflow-hidden font-display relative">
      {showNav && (
        <Navigation
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          user={user!}
        />
      )}

      <div className={`flex-1 overflow-y-auto no-scrollbar ${showNav ? 'pb-24 md:pb-0' : ''} w-full md:max-w-7xl md:mx-auto`}>
        {renderScreen()}
      </div>
    </div>
  );
};

export default App;
