'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import type { PermissionData } from '@/types';

const RESOURCES = ['processes', 'folders', 'users', 'roles', 'governance', 'publications', 'dictionary', 'audit-logs', 'settings'];
const ACTIONS = ['create', 'read', 'update', 'delete', 'publish', 'approve', 'manage'];

export default function AdminPermissionsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Permission matrix is a reference view
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Permission Matrix</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of available permissions by resource and action
        </p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                {ACTIONS.map((action) => (
                  <TableHead key={action} className="text-center capitalize">
                    {action}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {RESOURCES.map((resource) => (
                <TableRow key={resource}>
                  <TableCell className="font-medium capitalize">{resource}</TableCell>
                  {ACTIONS.map((action) => {
                    const applicable =
                      (action === 'publish' && (resource === 'processes' || resource === 'publications')) ||
                      (action === 'approve' && resource === 'governance') ||
                      (action === 'manage') ||
                      ['create', 'read', 'update', 'delete'].includes(action);

                    return (
                      <TableCell key={action} className="text-center">
                        {applicable ? (
                          <Badge variant="success" className="text-xs">
                            <Lock className="mr-1 h-3 w-3" />
                            {resource}:{action}
                          </Badge>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Permission Model</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>create</strong> — Allow creating new resources</p>
            <p><strong>read</strong> — Allow viewing resources</p>
            <p><strong>update</strong> — Allow modifying existing resources</p>
            <p><strong>delete</strong> — Allow removing resources</p>
            <p><strong>publish</strong> — Allow publishing processes/publications</p>
            <p><strong>approve</strong> — Allow approving governance instances</p>
            <p><strong>manage</strong> — Full management access (includes all actions)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
