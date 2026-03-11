'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, History, Loader2, AlertCircle, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import type { ProcessVersion } from '@/types';

export default function ProcessVersionsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [versions, setVersions] = useState<ProcessVersion[]>([]);
  const [processName, setProcessName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [versionsRes, processRes] = await Promise.all([
          fetch(`/api/processes/${id}/versions`),
          fetch(`/api/processes/${id}`),
        ]);

        if (!versionsRes.ok) throw new Error('Failed to fetch versions');
        const versionsData = await versionsRes.json();
        setVersions(versionsData.data || versionsData || []);

        if (processRes.ok) {
          const processData = await processRes.json();
          setProcessName(processData.name);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/processes/${id}`)}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Process
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <History className="h-6 w-6 text-gray-400" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Version History</h1>
          {processName && <p className="text-sm text-gray-500">{processName}</p>}
        </div>
      </div>

      {error && (
        <div className="flex flex-col items-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <p className="mt-4 text-gray-500">{error}</p>
        </div>
      )}

      {!error && versions.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <FileText className="h-16 w-16 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No versions yet</h3>
        </div>
      )}

      {!error && versions.length > 0 && (
        <div className="space-y-4">
          {versions.map((version, idx) => (
            <Card key={version.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={idx === 0 ? 'info' : 'default'}>v{version.version}</Badge>
                    <div>
                      <p className="font-medium text-gray-900">
                        {version.changelog || 'No changelog'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {version.createdBy.firstName} {version.createdBy.lastName} &middot;{' '}
                        {formatDateTime(version.createdAt)}
                      </p>
                    </div>
                  </div>
                  {idx === 0 && (
                    <Badge variant="success">Current</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
