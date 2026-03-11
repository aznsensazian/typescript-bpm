'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Loader2, AlertCircle, Plus, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { formatDateTime } from '@/lib/utils';
import type { GovernanceInstanceData, GovernanceWorkflowData } from '@/types';

const STATUS_VARIANT: Record<string, string> = {
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  APPROVED: 'success',
  REJECTED: 'destructive',
  CANCELLED: 'default',
};

export default function ProcessGovernancePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [instances, setInstances] = useState<GovernanceInstanceData[]>([]);
  const [workflows, setWorkflows] = useState<GovernanceWorkflowData[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [instancesRes, workflowsRes] = await Promise.all([
          fetch(`/api/governance/instances?processId=${id}`),
          fetch('/api/governance/workflows'),
        ]);

        if (instancesRes.ok) {
          const data = await instancesRes.json();
          setInstances(data.data || []);
        }
        if (workflowsRes.ok) {
          const data = await workflowsRes.json();
          setWorkflows(data.data || []);
        }
      } catch {
        // Silently handle
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  async function handleSubmit() {
    if (!selectedWorkflow) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/governance/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId: selectedWorkflow, processId: id }),
      });
      if (res.ok) {
        const instance = await res.json();
        setInstances((prev) => [instance, ...prev]);
        setSelectedWorkflow('');
      }
    } catch {
      // Handle error
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const workflowOptions = [
    { value: '', label: 'Select a workflow...' },
    ...workflows.map((w) => ({ value: w.id, label: w.name })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/processes/${id}`)}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Process
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-900">Process Governance</h1>
      </div>

      {/* Submit for review */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Submit for Review</h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <Select
                options={workflowOptions}
                value={selectedWorkflow}
                onChange={(e) => setSelectedWorkflow(e.target.value)}
              />
            </div>
            <Button onClick={handleSubmit} loading={submitting} disabled={!selectedWorkflow}>
              <Plus className="mr-1 h-4 w-4" />
              Submit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instances list */}
      {instances.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Shield className="h-16 w-16 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No governance instances</h3>
          <p className="mt-2 text-sm text-gray-500">Submit this process to a governance workflow above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {instances.map((instance) => (
            <Card key={instance.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{instance.workflow.name}</h4>
                      <Badge variant={STATUS_VARIANT[instance.status] as 'warning' | 'info' | 'success' | 'destructive' | 'default'}>
                        {instance.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Initiated by {instance.initiatedBy.firstName} {instance.initiatedBy.lastName} &middot;{' '}
                      {formatDateTime(instance.initiatedAt)}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    Step {instance.currentStep + 1}
                  </div>
                </div>
                {instance.approvals.length > 0 && (
                  <div className="mt-3 space-y-2 border-t pt-3">
                    {instance.approvals.map((approval) => (
                      <div key={approval.id} className="flex items-center gap-2 text-sm">
                        {approval.status === 'APPROVED' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        {approval.status === 'REJECTED' && <XCircle className="h-4 w-4 text-red-500" />}
                        {approval.status === 'PENDING' && <Clock className="h-4 w-4 text-yellow-500" />}
                        <span className="text-gray-700">
                          {approval.approver.firstName} {approval.approver.lastName}
                        </span>
                        <span className="text-gray-400">— {approval.status}</span>
                        {approval.comment && <span className="text-gray-400">: {approval.comment}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
