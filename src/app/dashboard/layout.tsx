'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { MainLayout } from '@/components/layout/main-layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();

  return (
    <MainLayout
      breadcrumbs={[{ label: 'Dashboard' }]}
      isAdmin={session?.user?.isAdmin ?? false}
      userName={
        session?.user
          ? `${session.user.firstName} ${session.user.lastName}`
          : undefined
      }
      userEmail={session?.user?.email}
    >
      {children}
    </MainLayout>
  );
}
