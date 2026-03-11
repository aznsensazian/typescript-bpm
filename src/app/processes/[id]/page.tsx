'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  History,
  Shield,
  Users,
  MessageSquare,
  Loader2,
  AlertCircle,
  Workflow,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatDateTime } from '@/lib/utils';
import type { ProcessData } from '@/types';

export default function ProcessDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [process, setProcess] = useState<ProcessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchProcess() {
      try {
        const res = await fetch(`/api/processes/${id}`);
        if (!res.ok) throw new Error('Failed to fetch process');
        setProcess(await res.json());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchProcess();
  }, [id]);

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this process?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/processes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      router.push('/processes');
    } catch {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !process) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="mt-4 text-gray-500">{error || 'Process not found'}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const statusVariant: Record<string, string> = {
    DRAFT: 'warning',
    PUBLISHED: 'success',
    UNDER_REVIEW: 'info',
    ARCHIVED: 'default',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/processes')}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Processes
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{process.name}</h1>
            <Badge variant={statusVariant[process.status] as 'warning' | 'success' | 'info' | 'default'}>
              {process.status}
            </Badge>
          </div>
          {process.description && (
            <p className="mt-2 text-gray-500">{process.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-400">
            <span>v{process.currentVersion}</span>
            {process.category && <span>| {process.category}</span>}
            <span>| Created {formatDateTime(process.createdAt)}</span>
            <span>| Updated {formatDateTime(process.updatedAt)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/processes/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={handleDelete} loading={deleting}>
            <Trash2 className="mr-1 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Process Diagram Placeholder */}
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8">
                <Workflow className="h-20 w-20 text-gray-300" />
                <p className="mt-4 text-sm text-gray-500">BPMN Process Diagram</p>
                <Link href={`/processes/${id}/edit`} className="mt-4">
                  <Button variant="outline" size="sm">Open in Editor</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created by</span>
                    <span className="font-medium">
                      {process.createdBy.firstName} {process.createdBy.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category</span>
                    <span className="font-medium">{process.category || 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Version</span>
                    <span className="font-medium">{process.currentVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Comments</span>
                    <span className="font-medium">{process._count?.comments ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Collaborators</span>
                    <span className="font-medium">{process._count?.collaborators ?? 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="versions">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Version History</h3>
                <Link href={`/processes/${id}/versions`}>
                  <Button variant="outline" size="sm">
                    <History className="mr-1 h-4 w-4" />
                    View All Versions
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-gray-500">Current version: v{process.currentVersion}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="governance">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Governance</h3>
                <Link href={`/processes/${id}/governance`}>
                  <Button variant="outline" size="sm">
                    <Shield className="mr-1 h-4 w-4" />
                    Manage Governance
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-gray-500">Submit this process for review and approval.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
