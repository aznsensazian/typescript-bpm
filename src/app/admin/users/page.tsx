'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCog,
  Loader2,
  AlertCircle,
  Search,
  ToggleLeft,
  ToggleRight,
  Shield,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Avatar } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';
import type { UserData } from '@/types';

const ACTIVE_OPTIONS = [
  { value: '', label: 'All Users' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (isActive) params.set('isActive', isActive);

      const res = await fetch(`/api/users?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, isActive]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, isActive]);

  async function toggleUserActive(userId: string, currentlyActive: boolean) {
    try {
      await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentlyActive }),
      });
      fetchUsers();
    } catch {
      // Handle error
    }
  }

  async function toggleAdmin(userId: string, currentlyAdmin: boolean) {
    try {
      await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: !currentlyAdmin }),
      });
      fetchUsers();
    } catch {
      // Handle error
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-500">Manage users and their permissions</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchInput placeholder="Search users..." onChange={(v) => setSearch(v)} />
        </div>
        <div className="w-full sm:w-48">
          <Select options={ACTIVE_OPTIONS} value={isActive} onChange={(e) => setIsActive(e.target.value)} />
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
          <Button variant="outline" className="mt-4" onClick={fetchUsers}>Retry</Button>
        </div>
      )}

      {!loading && !error && users.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <UserCog className="h-16 w-16 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No users found</h3>
        </div>
      )}

      {!loading && !error && users.length > 0 && (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={user.avatar}
                          initials={`${user.firstName[0]}${user.lastName[0]}`}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">{user.department || '—'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((ur) => (
                          <Badge key={ur.role.id} variant="outline">{ur.role.name}</Badge>
                        ))}
                        {user.roles.length === 0 && <span className="text-sm text-gray-400">No roles</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'success' : 'default'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isAdmin && <Badge variant="info">Admin</Badge>}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">{formatDate(user.createdAt)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleUserActive(user.id, user.isActive)}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {user.isActive ? (
                            <ToggleRight className="h-4 w-4 text-green-500" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAdmin(user.id, user.isAdmin)}
                          title={user.isAdmin ? 'Remove admin' : 'Make admin'}
                        >
                          <Shield className={`h-4 w-4 ${user.isAdmin ? 'text-blue-500' : 'text-gray-400'}`} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
