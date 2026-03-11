'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/main-layout';

export default function CollaborationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MainLayout
      breadcrumbs={[
        { label: 'Home', href: '/dashboard' },
        { label: 'Collaboration Hub' },
      ]}
    >
      {children}
    </MainLayout>
  );
}
