'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'importer' | 'bank' | 'exporter' | 'funder';
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);

    // Check if user has correct role
    if (parsedUser.role !== role) {
      router.push(`/${parsedUser.role}/dashboard`);
      return;
    }

    setUser(parsedUser);
  }, [role, router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const roleColors = {
    importer: 'bg-blue-600',
    bank: 'bg-green-600',
    exporter: 'bg-purple-600',
    funder: 'bg-orange-600',
  };

  const roleLabels = {
    importer: 'Importer Portal',
    bank: 'Bank Portal',
    exporter: 'Exporter Portal',
    funder: 'Funder Portal',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className={`${roleColors[role]} text-white shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">{roleLabels[role]}</h1>
              <p className="text-sm opacity-90">{user.name} - {user.organization}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
