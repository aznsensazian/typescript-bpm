'use client';

import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Plus,
  Loader2,
  AlertCircle,
  Trash2,
  Users,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import type { RoleData } from '@/types';

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [saving, setSaving] = useState(false);

  async function fetchRoles() {
    setLoading(true);
    try {
      const res = await fetch('/api/roles');
      if (!res.ok) throw new Error('Failed to fetch roles');
      const data = await res.json();
      setRoles(data.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRoles();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim() || null,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setFormName('');
        setFormDescription('');
        fetchRoles();
      }
    } catch {
      // Handle error
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(roleId: string) {
    if (!confirm('Delete this role?')) return;
    try {
      await fetch(`/api/roles/${roleId}`, { method: 'DELETE' });
      fetchRoles();
    } catch {
      // Handle error
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage roles with permission sets</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Role
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

      {!loading && !error && roles.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <KeyRound className="h-16 w-16 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No roles</h3>
          <p className="mt-2 text-sm text-gray-500">Create your first role.</p>
        </div>
      )}

      {!loading && !error && roles.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{role.name}</h3>
                      {role.isSystem && <Badge variant="info">System</Badge>}
                    </div>
                    {role.description && (
                      <p className="mt-1 text-sm text-gray-500">{role.description}</p>
                    )}
                  </div>
                  {!role.isSystem && (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(role.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {role._count?.users ?? 0} users
                  </span>
                  <span>{role.permissions.length} permissions</span>
                </div>
                {role.permissions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {role.permissions.slice(0, 5).map((rp) => (
                      <Badge key={rp.permission.id} variant="outline" className="text-xs">
                        {rp.permission.resource}:{rp.permission.action}
                      </Badge>
                    ))}
                    {role.permissions.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{role.permissions.length - 5} more
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="New Role" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Name *</label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={3} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Create Role</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
