'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FolderTree,
  Folder,
  FileText,
  Plus,
  Loader2,
  AlertCircle,
  ChevronRight,
  Search,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { formatDate } from '@/lib/utils';
import type { ProcessData, FolderData, ProcessStatus } from '@/types';

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

export default function RepositoryPage() {
  return (
    <Suspense>
      <RepositoryPageContent />
    </Suspense>
  );
}

function RepositoryPageContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [processes, setProcesses] = useState<ProcessData[]>([]);
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: 'Root' },
  ]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const processParams = new URLSearchParams();
      processParams.set('page', String(currentPage));
      processParams.set('limit', '12');
      if (search) processParams.set('search', search);
      if (status) processParams.set('status', status);
      if (currentFolderId) processParams.set('folderId', currentFolderId);

      const [processRes, folderRes] = await Promise.all([
        fetch(`/api/processes?${processParams.toString()}`),
        fetch(`/api/folders${currentFolderId ? `?parentId=${currentFolderId}` : ''}`),
      ]);

      if (!processRes.ok) throw new Error('Failed to fetch');

      const processData = await processRes.json();
      setProcesses(processData.data || []);
      setTotalPages(processData.pagination?.totalPages || 1);

      if (folderRes.ok) {
        const folderData = await folderRes.json();
        setFolders(folderData.data || folderData || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, status, currentFolderId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, status, currentFolderId]);

  function navigateToFolder(folderId: string | null, folderName: string) {
    if (folderId === null) {
      setBreadcrumbs([{ id: null, name: 'Root' }]);
    } else {
      setBreadcrumbs((prev) => [...prev, { id: folderId, name: folderName }]);
    }
    setCurrentFolderId(folderId);
  }

  function navigateToBreadcrumb(index: number) {
    const crumb = breadcrumbs[index];
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    setCurrentFolderId(crumb.id);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <FolderTree className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Process Repository</h1>
        </div>
        <p className="text-blue-100 text-lg">Browse and organize your process models</p>
      </div>

      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-1 text-sm text-gray-500">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight className="h-4 w-4" />}
            <button
              onClick={() => navigateToBreadcrumb(idx)}
              className={`hover:text-blue-600 ${idx === breadcrumbs.length - 1 ? 'font-medium text-gray-900' : ''}`}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center flex-1">
          <div className="flex-1">
            <SearchInput placeholder="Search processes..." onChange={(v) => setSearch(v)} />
          </div>
          <div className="w-full sm:w-48">
            <Select options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
          </div>
        </div>
        <Link href="/processes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Process
          </Button>
        </Link>
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
          <Button variant="outline" className="mt-4" onClick={fetchData}>Retry</Button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Folders */}
          {folders.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-500 uppercase tracking-wider">Folders</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => navigateToFolder(folder.id, folder.name)}
                    className="text-left"
                  >
                    <Card className="cursor-pointer transition-shadow hover:shadow-md">
                      <CardContent className="flex items-center gap-3 p-4">
                        <Folder className="h-8 w-8 text-yellow-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{folder.name}</p>
                          <p className="text-xs text-gray-400">
                            {folder._count?.processes ?? 0} processes
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Processes */}
          {processes.length > 0 ? (
            <div>
              {folders.length > 0 && (
                <h3 className="mb-3 text-sm font-medium text-gray-500 uppercase tracking-wider">Processes</h3>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                        <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                          <span>v{proc.currentVersion}</span>
                          <span>{formatDate(proc.updatedAt)}</span>
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
            </div>
          ) : (
            folders.length === 0 && (
              <div className="flex flex-col items-center py-16 text-center">
                <FileText className="h-16 w-16 text-gray-300" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">No processes found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {search || status ? 'Try adjusting your filters.' : 'Get started by creating a process.'}
                </p>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
