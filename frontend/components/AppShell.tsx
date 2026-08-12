'use client';

import { useState, useEffect, ReactNode, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const API_BASE = 'http://192.168.1.120:5000';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, userName, roleName, hasPermission, handleLogout, isLoading } = useAuth();

  const [org, setOrg] = useState({ prefix: '', orgName: 'Pacific Plus IT', logo: '' });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dark mode
  const [darkMode, setDarkMode] = useState(false);

  // Global search
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  // Load dark mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('darkMode', String(next));
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  }, []);

  // Fetch org info
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/settings/organization`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (data && !data.error) setOrg(data);
      })
      .catch(() => {});
  }, [token]);

  // Fetch notifications (warranty expiry + disposal alerts)
  useEffect(() => {
    if (!token) return;
    setNotifLoading(true);
    fetch(`${API_BASE}/api/assets`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!Array.isArray(data)) return;

        const alerts: any[] = [];
        const now = new Date();

        data.forEach((asset: any) => {
          // Warranty expiry within 30 days
          if (asset.warranty_end) {
            const warrantyEnd = new Date(asset.warranty_end);
            const daysUntilExpiry = Math.ceil((warrantyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
              alerts.push({
                type: 'warranty',
                icon: '⚠️',
                message: `${asset.name} (${asset.asset_code}) — ประกันหมดใน ${daysUntilExpiry} วัน`,
                date: asset.warranty_end,
                severity: daysUntilExpiry <= 7 ? 'high' : 'medium',
              });
            }
          }

          // Lifespan expiry (near disposal)
          if (asset.acquired_date && asset.lifespan_years) {
            const acquired = new Date(asset.acquired_date);
            const endOfLife = new Date(acquired);
            endOfLife.setFullYear(endOfLife.getFullYear() + Number(asset.lifespan_years));
            const daysUntilEnd = Math.ceil((endOfLife.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilEnd > 0 && daysUntilEnd <= 90 && asset.status === 'ใช้งานปกติ') {
              alerts.push({
                type: 'lifespan',
                icon: '🕐',
                message: `${asset.name} (${asset.asset_code}) — อายุใช้งานจะครบใน ${daysUntilEnd} วัน`,
                date: endOfLife.toISOString().split('T')[0],
                severity: daysUntilEnd <= 30 ? 'high' : 'medium',
              });
            }
          }

          // Damaged items waiting for repair
          if (asset.status === 'ชำรุดรอซ่อม') {
            alerts.push({
              type: 'damage',
              icon: '🔧',
              message: `${asset.name} (${asset.asset_code}) — ชำรุดรอซ่อม`,
              date: asset.updated_at || asset.created_at,
              severity: 'medium',
            });
          }
        });

        // Sort by severity then date
        alerts.sort((a, b) => {
          if (a.severity === 'high' && b.severity !== 'high') return -1;
          if (a.severity !== 'high' && b.severity === 'high') return 1;
          return 0;
        });

        setNotifications(alerts.slice(0, 20));
      })
      .catch(() => {})
      .finally(() => setNotifLoading(false));
  }, [token]);

  // Global search handler
  const handleGlobalSearch = useCallback(async (query: string) => {
    setGlobalSearch(query);
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }

    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/assets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!Array.isArray(data)) return;

      const q = query.toLowerCase();
      const results = data
        .filter((a: any) =>
          (a.asset_code || '').toLowerCase().includes(q) ||
          (a.name || '').toLowerCase().includes(q) ||
          (a.asset_number_1 || '').toLowerCase().includes(q) ||
          (a.category || '').toLowerCase().includes(q) ||
          (a.department || '').toLowerCase().includes(q)
        )
        .slice(0, 8);

      setSearchResults(results);
      setShowSearch(true);
    } catch {}
  }, [token]);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const navItem = (href: string, icon: string, label: string, color?: string) => (
    <Link
      href={href}
      onClick={() => setSidebarOpen(false)}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        isActive(href)
          ? 'bg-teal-600 text-white shadow-md shadow-teal-200'
          : `text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white ${color || ''}`
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );

  // Don't render shell on login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${darkMode ? 'bg-gray-800 border-r border-gray-700' : 'bg-white'}`}
      >
        {/* Org header */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className={`flex flex-col items-center text-center gap-3 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            {org.logo ? (
              <img src={org.logo} alt="Logo" className="w-24 h-24 object-contain shrink-0" />
            ) : (
              <div className="w-24 h-24 bg-transparent text-teal-600 flex items-center justify-center font-bold text-5xl shrink-0">
                {org.orgName ? org.orgName.charAt(0) : 'P'}
              </div>
            )}
            <div className="flex flex-col justify-center items-center w-full px-2">
              <h1 className={`text-[17px] font-bold leading-tight line-clamp-2 ${darkMode ? 'text-teal-400' : 'text-teal-700'}`} title={`${org.prefix} ${org.orgName}`}>
                {org.prefix} {org.orgName}
              </h1>
              <p className={`text-[16px] mt-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>ระบบบริหารจัดการครุภัณฑ์</p>
            </div>
          </div>

          {/* User info */}
          <div className={`p-4 rounded-xl border mt-6 text-center ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-base-200 border-base-300'}`}>
            <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : ''}`}>{userName || 'Loading...'}</p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{roleName || 'Loading...'}</p>
          </div>

          {/* Navigation */}
          <nav className="mt-8 flex flex-col gap-2 pb-6">
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 px-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>จัดการครุภัณฑ์</h3>
              <div className="space-y-1">
                {navItem('/', '📊', 'หน้าหลัก (Dashboard)')}
                {hasPermission('create_asset') && navItem('/create', '➕', 'ขึ้นทะเบียนครุภัณฑ์ใหม่')}
              </div>
            </div>

            <div className="mt-4">
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 px-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>ตรวจนับและซ่อมบำรุง</h3>
              <div className="space-y-1">
                {navItem('/audits', '📋', 'ระบบตรวจนับครุภัณฑ์', 'text-teal-600')}
                {navItem('/repairs', '🛠️', 'ระบบแจ้งซ่อม', 'text-orange-500')}
              </div>
            </div>

            {(hasPermission('manage_users') || hasPermission('manage_org') || hasPermission('manage_running_number') || hasPermission('manage_roles')) && (
              <div className="mt-4">
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 px-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>ตั้งค่าระบบทั้งหมด</h3>
                <div className="space-y-1">
                  {hasPermission('manage_users') && navItem('/settings/users', '👥', 'เพิ่ม/จัดการผู้ใช้งาน', 'text-warning')}
                  {hasPermission('manage_org') && navItem('/settings/organization', '🏢', 'ตั้งค่าหน่วยงาน', 'text-warning')}
                  {hasPermission('manage_running_number') && navItem('/settings/running-number', '🔢', 'ตั้งค่าเลขที่ทั้งหมด', 'text-warning')}
                  {hasPermission('manage_roles') && navItem('/settings/permissions', '⚙️', 'ตั้งค่าสิทธิ์การใช้งาน', 'text-warning')}
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* Dark mode + Logout */}
        <div className={`p-4 border-t shrink-0 space-y-2 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-base-200 bg-white'}`}>
          <button
            onClick={toggleDarkMode}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition ${
              darkMode
                ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {darkMode ? '☀️ โหมดสว่าง' : '🌙 โหมดมืด'}
          </button>
          <button onClick={handleLogout} className="btn btn-outline btn-error w-full">
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top bar (desktop: search + notifications; mobile: hamburger) */}
        <div className={`sticky top-0 z-30 border-b px-4 lg:px-6 py-3 flex items-center gap-3 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn btn-ghost btn-sm btn-circle lg:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Mobile org name */}
          <span className={`font-bold truncate lg:hidden ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{org.orgName}</span>

          {/* Global search */}
          <div className="relative flex-1 max-w-xl hidden lg:block">
            <input
              type="text"
              placeholder="🔍 ค้นหาครุภัณฑ์ทั้งระบบ..."
              value={globalSearch}
              onChange={(e) => handleGlobalSearch(e.target.value)}
              onFocus={() => globalSearch.length >= 2 && setShowSearch(true)}
              onBlur={() => setTimeout(() => setShowSearch(false), 200)}
              className={`w-full px-4 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-teal-500 focus:outline-none transition ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400'
                  : 'bg-gray-50 border-gray-200 placeholder-gray-400'
              }`}
            />
            {showSearch && searchResults.length > 0 && (
              <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl shadow-xl border overflow-hidden z-50 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
              }`}>
                {searchResults.map((asset: any) => (
                  <Link
                    key={asset.id}
                    href={`/view/${asset.id}`}
                    className={`flex items-center gap-3 px-4 py-3 border-b last:border-b-0 transition ${
                      darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-50 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center text-teal-600 dark:text-teal-400 text-xs font-bold shrink-0">
                      {asset.status === 'ใช้งานปกติ' ? '✅' : asset.status === 'ชำรุดรอซ่อม' ? '🔧' : '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{asset.name}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{asset.asset_code} · {asset.category}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      asset.status === 'ใช้งานปกติ'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                    }`}>{asset.status}</span>
                  </Link>
                ))}
                <Link
                  href="/"
                  onClick={() => { setShowSearch(false); setGlobalSearch(''); }}
                  className={`block text-center py-2.5 text-sm font-medium transition ${
                    darkMode ? 'text-teal-400 hover:bg-gray-700' : 'text-teal-600 hover:bg-gray-50'
                  }`}
                >
                  ดูผลลัพธ์ทั้งหมด →
                </Link>
              </div>
            )}
          </div>

          {/* Right side: notifications + dark mode toggle (desktop) */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Dark mode toggle (desktop) */}
            <button
              onClick={toggleDarkMode}
              className={`hidden lg:flex items-center justify-center w-9 h-9 rounded-xl transition ${
                darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>

            {/* Notifications bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotif(!showNotif)}
                className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition ${
                  darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                🔔
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {showNotif && (
                <div className={`absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl shadow-xl border z-50 ${
                  darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                }`}>
                  <div className={`px-4 py-3 border-b flex items-center justify-between ${
                    darkMode ? 'border-gray-700' : 'border-gray-100'
                  }`}>
                    <h3 className={`font-bold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>🔔 การแจ้งเตือน</h3>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{notifications.length} รายการ</span>
                  </div>

                  {notifLoading ? (
                    <div className="p-6 text-center">
                      <span className="loading loading-spinner loading-sm text-primary"></span>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-3xl mb-2">✅</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>ไม่มีการแจ้งเตือน</p>
                    </div>
                  ) : (
                    <div>
                      {notifications.map((notif, i) => (
                        <div
                          key={i}
                          className={`px-4 py-3 border-b last:border-b-0 transition ${
                            darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-50 hover:bg-gray-50'
                          } ${notif.severity === 'high' ? (darkMode ? 'bg-red-900/20' : 'bg-red-50/50') : ''}`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-base shrink-0">{notif.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{notif.message}</p>
                              <p className={`text-[10px] mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{notif.date}</p>
                            </div>
                            {notif.severity === 'high' && (
                              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1"></span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className={`flex-1 overflow-y-auto ${darkMode ? 'bg-gray-900' : ''}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
