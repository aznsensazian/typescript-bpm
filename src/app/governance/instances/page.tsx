'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ListChecks,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { formatDateTime } from '@/lib/utils';
import type { GovernanceInstanceData } from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_VARIANT: Record<string, string> = {
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  APPROVED: 'success',
  REJECTED: 'destructive',
  CANCELLED: 'default',
};

export default function GovernanceInstancesPage() {
  const [instances, setInstances] = useState<GovernanceInstanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchInstances = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('limit', '20');
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/governance/instances?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setInstances(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter]);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  async function handleApprove(instanceId: string, approved: boolean) {
    try {
      await fetch(`/api/governance/instances/${instanceId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: approved ? 'APPROVED' : 'REJECTED',
        }),
      });
      fetchInstances();
    } catch {
      // Handle error
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Governance Instances</h1>
          <p className="mt-1 text-sm text-gray-500">Review and manage process approval requests</p>
        </div>
        <div className="w-48">
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <p className="mt-4 text-gray-500">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchInstances}>Retry</Button>
        </div>
      )}

      {!loading && !error && instances.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <ListChecks className="h-16 w-16 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No instances found</h3>
          <p className="mt-2 text-sm text-gray-500">No governance instances match your filters.</p>
        </div>
      )}

      {!loading && !error && instances.length > 0 && (
        <>
          <div className="space-y-4">
            {instances.map((instance) => (
              <Card key={instance.id}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">
                          {instance.process.name}
                        </h4>
                        <Badge variant={STATUS_VARIANT[instance.status] as 'warning' | 'info' | 'success' | 'destructive' | 'default'}>
                          {instance.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Workflow: {instance.workflow.name} &middot; Step {instance.currentStep + 1}
                      </p>
                      <p className="text-xs text-gray-400">
                        By {instance.initiatedBy.firstName} {instance.initiatedBy.lastName} &middot;{' '}
                        {formatDateTime(instance.initiatedAt)}
                      </p>
                    </div>
                    {(instance.status === 'PENDING' || instance.status === 'IN_PROGRESS') && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(instance.id, true)}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4 text-green-500" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(instance.id, false)}
                        >
                          <XCircle className="mr-1 h-4 w-4 text-red-500" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
