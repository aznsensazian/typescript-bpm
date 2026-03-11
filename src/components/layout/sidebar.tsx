'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PenTool,
  FolderTree,
  Users,
  Shield,
  BarChart3,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Workflow,
  UserCog,
  KeyRound,
  Lock,
  FileText,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface AdminSubItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const mainNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Process Modeler', href: '/processes/new', icon: PenTool },
  { label: 'Process Repository', href: '/repository', icon: FolderTree },
  { label: 'Collaboration Hub', href: '/collaboration', icon: Users },
  { label: 'Process Governance', href: '/governance', icon: Shield },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Process Dictionary', href: '/dictionary', icon: BookOpen },
];

const adminSubItems: AdminSubItem[] = [
  { label: 'Users', href: '/admin/users', icon: UserCog },
  { label: 'Roles', href: '/admin/roles', icon: KeyRound },
  { label: 'Permissions', href: '/admin/permissions', icon: Lock },
  { label: 'Audit Log', href: '/admin/audit-log', icon: FileText },
  { label: 'Settings', href: '/admin/settings', icon: Wrench },
];

interface SidebarProps {
  isAdmin?: boolean;
}

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [adminExpanded, setAdminExpanded] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const isAdminActive = pathname.startsWith('/admin');

  return (
    <aside
      className={cn(
        'flex h-screen flex-col bg-gray-900 text-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-800 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600">
          <Workflow className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight whitespace-nowrap">
            ProcessFlow BPM
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* Separator */}
        <div className="my-3 border-t border-gray-800" />

        {/* Administration (admin only) */}
        {isAdmin && (
          <div>
            <button
              onClick={() => setAdminExpanded(!adminExpanded)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isAdminActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
              title={collapsed ? 'Administration' : undefined}
            >
              <Settings className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Administration</span>
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 transition-transform',
                      adminExpanded && 'rotate-90'
                    )}
                  />
                </>
              )}
            </button>

            {/* Admin sub-items */}
            {adminExpanded && !collapsed && (
              <div className="ml-4 mt-1 space-y-1 border-l border-gray-700 pl-3">
                {adminSubItems.map((subItem) => {
                  const SubIcon = subItem.icon;
                  const active = pathname === subItem.href;
                  return (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                        active
                          ? 'bg-gray-800 text-white font-medium'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                      )}
                    >
                      <SubIcon className="h-4 w-4 shrink-0" />
                      <span>{subItem.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-gray-800 p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg p-2.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
