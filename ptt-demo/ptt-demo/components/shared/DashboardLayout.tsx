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
  const [dropdownOpen, setDropdownOpen] = useState(false);

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

  const roleLabels = {
    importer: 'IMPORTER',
    bank: 'BANK',
    exporter: 'EXPORTER',
    funder: 'FUNDER',
  };

  const navLinks = {
    importer: [
      { label: 'Dashboard', href: '/importer/dashboard' },
      { label: 'Request PTT', href: '/importer/request-ptt' },
      { label: 'Review Documents', href: '/importer/review-documents' },
    ],
    bank: [
      { label: 'Dashboard', href: '/bank/dashboard' },
      { label: 'Outstanding PTTs', href: '/bank/outstanding-ptts' },
      { label: 'Settlements', href: '/bank/settlements' },
    ],
    exporter: [
      { label: 'Dashboard', href: '/exporter/dashboard' },
      { label: 'Upload Documents', href: '/exporter/upload-documents' },
      { label: 'Discount Offers', href: '/exporter/discount-offers' },
    ],
    funder: [
      { label: 'Marketplace', href: '/funder/dashboard' },
      { label: 'My Portfolio', href: '/funder/portfolio' },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-purple-600 text-white shadow-lg rounded-b-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center -ml-2">
              <img
                src="/Xaults_logo_light.png"
                alt="Xaults Logo"
                className="h-7 w-auto cursor-pointer"
                onClick={() => router.push(`/${role}/dashboard`)}
              />
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks[role].map((link, index) => (
                <button
                  key={`${link.label}-${index}`}
                  onClick={() => router.push(link.href)}
                  className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium"
                >
                  {link.label}
                </button>
              ))}
            </nav>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="text-right">
                  <p className="font-semibold text-sm">{user.name}</p>
                  <p className="text-xs opacity-80">{roleLabels[role]}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-600">Role: {roleLabels[role]}</p>
                    {user.organization && (
                      <p className="text-sm text-gray-600">Organization: {user.organization}</p>
                    )}
                    {user.email && (
                      <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-colors font-medium"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Close dropdown when clicking outside */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </div>
  );
}
