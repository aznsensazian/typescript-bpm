'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Loader2,
  TrendingUp,
  FileText,
  Users,
  MessageSquare,
  Shield,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';

const PERIOD_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
];

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
    period: string;
    comments: number;
    publications: number;
    auditEvents: number;
  };
  governance: Record<string, number>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics?period=${period}`);
        if (res.ok) {
          setAnalytics(await res.json());
        }
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const ov = analytics?.overview;
  const ac = analytics?.activity;
  const gov = analytics?.governance || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-8 text-white flex-1">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Analytics</h1>
          </div>
          <p className="text-blue-100 text-lg">Platform usage and activity insights</p>
        </div>
      </div>

      <div className="flex justify-end">
        <div className="w-48">
          <Select options={PERIOD_OPTIONS} value={period} onChange={(e) => setPeriod(e.target.value)} />
        </div>
      </div>

      {/* Process Stats */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Process Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Processes', value: ov?.totalProcesses ?? 0, icon: FileText, color: 'bg-blue-500' },
            { label: 'Published', value: ov?.publishedProcesses ?? 0, icon: TrendingUp, color: 'bg-green-500' },
            { label: 'Drafts', value: ov?.draftProcesses ?? 0, icon: FileText, color: 'bg-yellow-500' },
            { label: 'Archived', value: ov?.archivedProcesses ?? 0, icon: FileText, color: 'bg-gray-500' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                      <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* User Stats */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Users</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{ov?.totalUsers ?? 0}</p>
                </div>
                <Users className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Users</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{ov?.activeUsers ?? 0}</p>
                </div>
                <Users className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Activity ({period})</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-blue-400" />
              <p className="mt-2 text-2xl font-bold text-gray-900">{ac?.comments ?? 0}</p>
              <p className="text-sm text-gray-500">Comments</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-indigo-400" />
              <p className="mt-2 text-2xl font-bold text-gray-900">{ac?.publications ?? 0}</p>
              <p className="text-sm text-gray-500">Publications</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <FileText className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-2xl font-bold text-gray-900">{ac?.auditEvents ?? 0}</p>
              <p className="text-sm text-gray-500">Audit Events</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Governance */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Governance Summary</h2>
        <Card>
          <CardContent className="p-5">
            <div className="grid gap-4 sm:grid-cols-5">
              {['PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'CANCELLED'].map((status) => {
                const variant: Record<string, string> = {
                  PENDING: 'warning',
                  IN_PROGRESS: 'info',
                  APPROVED: 'success',
                  REJECTED: 'destructive',
                  CANCELLED: 'default',
                };
                return (
                  <div key={status} className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{gov[status] ?? 0}</p>
                    <Badge variant={variant[status] as 'warning' | 'info' | 'success' | 'destructive' | 'default'} className="mt-1">
                      {status.replace('_', ' ')}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
