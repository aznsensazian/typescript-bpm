'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Loader2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatDateTime } from '@/lib/utils';
import type { AuditLogData } from '@/types';

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'LOGIN', label: 'Login' },
];

const RESOURCE_OPTIONS = [
  { value: '', label: 'All Resources' },
  { value: 'process', label: 'Process' },
  { value: 'folder', label: 'Folder' },
  { value: 'user', label: 'User' },
  { value: 'role', label: 'Role' },
  { value: 'dictionary', label: 'Dictionary' },
  { value: 'governance', label: 'Governance' },
];

const ACTION_VARIANT: Record<string, string> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'destructive',
  LOGIN: 'default',
};

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState('');
  const [resource, setResource] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('limit', '30');
      if (action) params.set('action', action);
      if (resource) params.set('resource', resource);

      const res = await fetch(`/api/audit-log?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      const data = await res.json();
      setLogs(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [currentPage, action, resource]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [action, resource]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <p className="mt-1 text-sm text-gray-500">Track all system activity and changes</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="w-full sm:w-48">
          <Select options={ACTION_OPTIONS} value={action} onChange={(e) => setAction(e.target.value)} />
        </div>
        <div className="w-full sm:w-48">
          <Select options={RESOURCE_OPTIONS} value={resource} onChange={(e) => setResource(e.target.value)} />
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
          <Button variant="outline" className="mt-4" onClick={fetchLogs}>Retry</Button>
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <FileText className="h-16 w-16 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No audit logs</h3>
          <p className="mt-2 text-sm text-gray-500">System activity will appear here.</p>
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <>
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Resource ID</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDateTime(log.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.user
                          ? `${log.user.firstName} ${log.user.lastName}`
                          : 'System'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ACTION_VARIANT[log.action] as 'success' | 'info' | 'destructive' | 'default' || 'default'}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm capitalize">{log.resource}</TableCell>
                      <TableCell className="text-xs text-gray-400 font-mono">
                        {log.resourceId ? log.resourceId.substring(0, 8) + '...' : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 max-w-48 truncate">
                        {log.details || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

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
