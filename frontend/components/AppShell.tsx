'use client';

import { useState, useEffect, ReactNode } from 'react';
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
  const { userName, roleName, hasPermission, handleLogout, isLoading } = useAuth();

  const [org, setOrg] = useState({ prefix: '', orgName: 'Pacific Plus IT', logo: '' });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE}/api/settings/organization`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (data && !data.error) setOrg(data);
      })
      .catch(() => {});
  }, []);

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
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
          : `text-gray-600 hover:bg-gray-100 hover:text-gray-900 ${color || ''}`
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
      <div className="flex items-center justify-center min-h-screen bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-white shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Org header */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex flex-col items-center text-center gap-3 py-4 border-b border-gray-100">
            {org.logo ? (
              <img src={org.logo} alt="Logo" className="w-24 h-24 object-contain shrink-0" />
            ) : (
              <div className="w-24 h-24 bg-transparent text-indigo-600 flex items-center justify-center font-bold text-5xl shrink-0">
                {org.orgName ? org.orgName.charAt(0) : 'P'}
              </div>
            )}
            <div className="flex flex-col justify-center items-center w-full px-2">
              <h1 className="text-[17px] font-bold text-indigo-700 leading-tight line-clamp-2" title={`${org.prefix} ${org.orgName}`}>
                {org.prefix} {org.orgName}
              </h1>
              <p className="text-[16px] text-gray-500 mt-1.5">ระบบบริหารจัดการครุภัณฑ์</p>
            </div>
          </div>

          {/* User info */}
          <div className="bg-base-200 p-4 rounded-xl border border-base-300 mt-6 text-center">
            <p className="text-sm font-semibold">{userName || 'Loading...'}</p>
            <p className="text-xs text-gray-500 mt-1">{roleName || 'Loading...'}</p>
          </div>

          {/* Navigation */}
          <nav className="mt-8 flex flex-col gap-2 pb-6">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">จัดการครุภัณฑ์</h3>
              <div className="space-y-1">
                {navItem('/', '📊', 'หน้าหลัก (Dashboard)')}
                {hasPermission('create_asset') && navItem('/create', '➕', 'ขึ้นทะเบียนครุภัณฑ์ใหม่')}
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">ตรวจนับและซ่อมบำรุง</h3>
              <div className="space-y-1">
                {navItem('/audits', '📋', 'ระบบตรวจนับครุภัณฑ์', 'text-indigo-600')}
                {navItem('/repairs', '🛠️', 'ระบบแจ้งซ่อม', 'text-orange-500')}
              </div>
            </div>

            {(hasPermission('manage_users') || hasPermission('manage_org') || hasPermission('manage_running_number') || hasPermission('manage_roles')) && (
              <div className="mt-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">ตั้งค่าระบบทั้งหมด</h3>
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

        {/* Logout */}
        <div className="p-6 border-t border-base-200 bg-white shrink-0">
          <button onClick={handleLogout} className="btn btn-outline btn-error w-full">
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-gray-700 truncate">{org.orgName}</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
