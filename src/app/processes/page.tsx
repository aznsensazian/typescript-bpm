'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  Loader2,
  FileText,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { formatDate } from '@/lib/utils';
import type { ProcessData, ProcessStatus } from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const STATUS_COLORS: Record<ProcessStatus, string> = {
  DRAFT: 'warning',
  PUBLISHED: 'success',
  UNDER_REVIEW: 'info',
  ARCHIVED: 'default',
};

export default function ProcessesPage() {
  const router = useRouter();
  const [processes, setProcesses] = useState<ProcessData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProcesses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('limit', '12');
      if (search) params.set('search', search);
      if (status) params.set('status', status);

      const res = await fetch(`/api/processes?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch processes');
      const data = await res.json();
      setProcesses(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, status]);

  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, status]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Processes</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your business process models</p>
        </div>
        <Link href="/processes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Process
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchInput placeholder="Search processes..." onChange={(v) => setSearch(v)} />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="All Statuses"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <p className="mt-4 text-gray-500">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchProcesses}>Retry</Button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && processes.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <FileText className="h-16 w-16 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No processes found</h3>
          <p className="mt-2 text-sm text-gray-500">Get started by creating your first process.</p>
          <Link href="/processes/new" className="mt-4">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Process
            </Button>
          </Link>
        </div>
      )}

      {/* Process Grid */}
      {!loading && !error && processes.length > 0 && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {processes.map((proc) => (
              <Link key={proc.id} href={`/processes/${proc.id}`}>
                <Card className="group h-full cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{proc.name}</h3>
                      <Badge variant={STATUS_COLORS[proc.status] as 'warning' | 'success' | 'info' | 'default'}>
                        {proc.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                      {proc.description || 'No description'}
                    </p>
                    {proc.category && (
                      <Badge variant="outline" className="mt-2">{proc.category}</Badge>
                    )}
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                      <span>
                        {proc.createdBy
                          ? `${proc.createdBy.firstName} ${proc.createdBy.lastName}`
                          : 'Unknown'}
                      </span>
                      <span>{formatDate(proc.updatedAt)}</span>
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-gray-400">
                      <span>v{proc.currentVersion}</span>
                      {proc._count && <span>{proc._count.comments} comments</span>}
                      {proc._count && <span>{proc._count.collaborators} collaborators</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
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
