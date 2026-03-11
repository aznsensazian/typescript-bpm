'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  FileText,
  Users,
  Shield,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  PenTool,
  FolderTree,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AnalyticsData {
  overview: {
    totalProcesses: number;
    publishedProcesses: number;
    draftProcesses: number;
    archivedProcesses: number;
    totalUsers: number;
    activeUsers: number;
  };
  activity: {
    comments: number;
    publications: number;
    auditEvents: number;
  };
  governance: Record<string, number>;
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/analytics?period=30d');
        if (res.ok) {
          setAnalytics(await res.json());
        }
      } catch {
        // Silently handle - dashboard shows placeholder
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Processes',
      value: analytics?.overview.totalProcesses ?? 0,
      icon: FileText,
      color: 'bg-blue-500',
      href: '/repository',
    },
    {
      label: 'Published',
      value: analytics?.overview.publishedProcesses ?? 0,
      icon: CheckCircle2,
      color: 'bg-green-500',
      href: '/repository?status=PUBLISHED',
    },
    {
      label: 'Drafts',
      value: analytics?.overview.draftProcesses ?? 0,
      icon: Clock,
      color: 'bg-yellow-500',
      href: '/repository?status=DRAFT',
    },
    {
      label: 'Active Users',
      value: analytics?.overview.activeUsers ?? 0,
      icon: Users,
      color: 'bg-purple-500',
      href: '/admin/users',
    },
  ];

  const quickActions = [
    { label: 'New Process', href: '/processes/new', icon: PenTool, description: 'Create a new BPMN process' },
    { label: 'Browse Repository', href: '/repository', icon: FolderTree, description: 'Explore existing processes' },
    { label: 'Collaboration Hub', href: '/collaboration', icon: Users, description: 'View published processes' },
    { label: 'Governance', href: '/governance', icon: Shield, description: 'Manage approval workflows' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <LayoutDashboard className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <p className="text-blue-100 text-lg">
          Welcome to ProcessFlow BPM. Manage your business processes efficiently.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="transition-shadow hover:shadow-md cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                      <p className="mt-1 text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="group h-full transition-all hover:shadow-md hover:border-blue-200">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-3 font-semibold text-gray-900">{action.label}</h3>
                    <p className="mt-1 text-sm text-gray-500">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Activity & Governance Summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Activity (Last 30 days)</h3>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Comments</span>
                <Badge variant="info">{analytics?.activity.comments ?? 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Publications</span>
                <Badge variant="info">{analytics?.activity.publications ?? 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Audit Events</span>
                <Badge variant="info">{analytics?.activity.auditEvents ?? 0}</Badge>
              </div>
            </div>
            <Link href="/analytics" className="mt-4 block">
              <Button variant="ghost" size="sm" className="w-full">
                View Analytics <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Governance Overview */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Governance Status</h3>
              <Shield className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending</span>
                <Badge variant="warning">{analytics?.governance?.PENDING ?? 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">In Progress</span>
                <Badge variant="info">{analytics?.governance?.IN_PROGRESS ?? 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Approved</span>
                <Badge variant="success">{analytics?.governance?.APPROVED ?? 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Rejected</span>
                <Badge variant="destructive">{analytics?.governance?.REJECTED ?? 0}</Badge>
              </div>
            </div>
            <Link href="/governance" className="mt-4 block">
              <Button variant="ghost" size="sm" className="w-full">
                View Governance <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
