'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Workflow,
  Plus,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/utils';
import type { GovernanceWorkflowData } from '@/types';

const TRIGGER_TYPES = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'ON_PUBLISH', label: 'On Publish' },
  { value: 'ON_CHANGE', label: 'On Change' },
];

export default function GovernanceWorkflowsPage() {
  const [workflows, setWorkflows] = useState<GovernanceWorkflowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTrigger, setFormTrigger] = useState('MANUAL');
  const [saving, setSaving] = useState(false);

  async function fetchWorkflows() {
    setLoading(true);
    try {
      const res = await fetch('/api/governance/workflows');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setWorkflows(data.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWorkflows();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/governance/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim() || null,
          triggerType: formTrigger,
          steps: [],
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setFormName('');
        setFormDescription('');
        setFormTrigger('MANUAL');
        fetchWorkflows();
      }
    } catch {
      // Handle error
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(workflowId: string) {
    if (!confirm('Delete this workflow?')) return;
    try {
      await fetch(`/api/governance/workflows/${workflowId}`, { method: 'DELETE' });
      fetchWorkflows();
    } catch {
      // Handle error
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Governance Workflows</h1>
          <p className="mt-1 text-sm text-gray-500">Define approval and review workflows</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Workflow
        </Button>
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
        </div>
      )}

      {!loading && !error && workflows.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <Workflow className="h-16 w-16 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No workflows</h3>
          <p className="mt-2 text-sm text-gray-500">Create your first governance workflow.</p>
        </div>
      )}

      {!loading && !error && workflows.length > 0 && (
        <div className="space-y-4">
          {workflows.map((wf) => (
            <Card key={wf.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{wf.name}</h3>
                      <Badge variant={wf.status === 'ACTIVE' ? 'success' : 'default'}>
                        {wf.status}
                      </Badge>
                      <Badge variant="outline">{wf.triggerType}</Badge>
                    </div>
                    {wf.description && (
                      <p className="mt-1 text-sm text-gray-500">{wf.description}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      Created by {wf.createdBy.firstName} {wf.createdBy.lastName} &middot;{' '}
                      {formatDate(wf.createdAt)}
                      {wf._count && ` &middot; ${wf._count.instances} instances`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(wf.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <Modal open={showModal} title="New Governance Workflow" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Name *</label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={3} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Trigger Type</label>
              <Select options={TRIGGER_TYPES} value={formTrigger} onChange={(e) => setFormTrigger(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Create Workflow</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
