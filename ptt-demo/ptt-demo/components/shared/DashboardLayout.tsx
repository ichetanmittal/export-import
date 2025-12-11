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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  // Determine theme colors based on role and organization
  const getThemeColors = () => {
    // ICICI orange gradient for all users
    return {
      navbar: 'bg-gradient-to-r from-orange-500 to-orange-700',
      navbarHover: 'hover:bg-orange-700',
      sidebarHover: 'hover:bg-orange-50 hover:text-orange-600',
      button: 'bg-orange-600',
      buttonHover: 'hover:bg-orange-700',
      accent: 'orange',
    };
  };

  const themeColors = getThemeColors();

  const navLinks = {
    importer: [
      { label: 'Dashboard', href: '/importer/dashboard' },
      { label: 'Request PTT', href: '/importer/request-ptt' },
      { label: 'Review Documents', href: '/importer/review-documents' },
      { label: 'My Exporters', href: '/importer/exporters' },
      { label: 'Profile', href: '/importer/profile' },
    ],
    bank: [
      { label: 'Dashboard', href: '/bank/dashboard' },
      { label: 'Outstanding PTTs', href: '/bank/outstanding-ptts' },
      { label: 'Settlements', href: '/bank/settlements' },
      { label: 'Pending Approvals', href: '/bank/pending-approvals' },
      { label: 'Blacklist', href: '/bank/blacklist' },
    ],
    exporter: [
      { label: 'Dashboard', href: '/exporter/dashboard' },
      { label: 'Upload Documents', href: '/exporter/upload-documents' },
      { label: 'Discount Offers', href: '/exporter/discount-offers' },
      { label: 'My Importers', href: '/exporter/importers' },
      { label: 'Profile', href: '/exporter/profile' },
    ],
    funder: [
      { label: 'Marketplace', href: '/funder/dashboard' },
      { label: 'My Portfolio', href: '/funder/portfolio' },
      { label: 'Pending Approvals', href: '/funder/pending-approvals' },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <header className={`${themeColors.navbar} text-white shadow-lg fixed top-0 left-0 right-0 z-30`}>
        <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-3">
          {/* Logo */}
          <div className="flex items-center">
            <img
              src="/Xaults_logo_light.png"
              alt="Xaults Logo"
              className="h-7 w-auto cursor-pointer"
              onClick={() => router.push(`/${role}/dashboard`)}
            />
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="text-right hidden sm:block">
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
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 top-16 z-20 w-64 bg-white border-r border-gray-200 shadow-lg
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:top-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <nav className="h-full px-4 py-6 space-y-2 overflow-y-auto">
            {navLinks[role].map((link, index) => (
              <button
                key={`${link.label}-${index}`}
                onClick={() => {
                  router.push(link.href);
                  setSidebarOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg ${themeColors.sidebarHover} transition-colors font-medium text-gray-700`}
              >
                {link.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`lg:hidden fixed bottom-4 left-4 z-30 p-3 rounded-full ${themeColors.button} text-white shadow-lg`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {sidebarOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-10 lg:hidden top-16"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setDropdownOpen(false)}
        />
      )}
    </div>
  );
}
