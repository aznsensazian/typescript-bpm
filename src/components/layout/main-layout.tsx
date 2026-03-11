'use client';

import React from 'react';
import { Sidebar } from './sidebar';
import { Header, type Breadcrumb } from './header';

interface MainLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
  isAdmin?: boolean;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  notificationCount?: number;
}

export function MainLayout({
  children,
  breadcrumbs,
  isAdmin = false,
  userName,
  userEmail,
  userAvatar,
  notificationCount,
}: MainLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar isAdmin={isAdmin} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header
          breadcrumbs={breadcrumbs}
          userName={userName}
          userEmail={userEmail}
          userAvatar={userAvatar}
          notificationCount={notificationCount}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
