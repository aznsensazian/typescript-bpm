'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { MainLayout } from '@/components/layout/main-layout';

export default function GovernanceLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  return (
    <MainLayout
      breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Governance' }]}
      isAdmin={session?.user?.isAdmin ?? false}
      userName={session?.user ? `${session.user.firstName} ${session.user.lastName}` : undefined}
      userEmail={session?.user?.email}
    >
      {children}
    </MainLayout>
  );
}
