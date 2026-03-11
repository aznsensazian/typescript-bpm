'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Star,
  Eye,
  Users,
  Filter,
  Workflow,
  Loader2,
  AlertCircle,
  FileQuestion,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Pagination } from '@/components/ui/pagination';
import { formatDate, truncate } from '@/lib/utils';
import type { PublicationData } from '@/types';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'HR', label: 'HR' },
  { value: 'Finance', label: 'Finance' },
  { value: 'IT', label: 'IT' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Compliance', label: 'Compliance' },
];

const PAGE_SIZE = 9;

function getAverageRating(feedbacks: { rating: number }[]): number {
  if (!feedbacks || feedbacks.length === 0) return 0;
  const sum = feedbacks.reduce((acc, f) => acc + f.rating, 0);
  return sum / feedbacks.length;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= Math.round(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
      <span className="ml-1 text-sm text-gray-500">
        {rating > 0 ? rating.toFixed(1) : 'No ratings'}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FileQuestion className="h-16 w-16 text-gray-300" />
      <h3 className="mt-4 text-lg font-semibold text-gray-900">
        No published processes found
      </h3>
      <p className="mt-2 text-sm text-gray-500">
        There are no published processes matching your filters. Try adjusting
        your search or category filter.
      </p>
    </div>
  );
}

export default function CollaborationPage() {
  const [publications, setPublications] = useState<PublicationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchPublications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('limit', String(PAGE_SIZE));
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (activeTab === 'public') params.set('isPublic', 'true');
      if (activeTab === 'internal') params.set('isPublic', 'false');

      const res = await fetch(`/api/collaboration?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch publications');
      const data = await res.json();
      setPublications(data.publications || data.data || []);
      setTotalCount(data.total || data.publications?.length || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, category, activeTab]);

  useEffect(() => {
    fetchPublications();
  }, [fetchPublications]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, category, activeTab]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-10 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Process Collaboration Hub</h1>
        </div>
        <p className="mt-2 text-lg text-blue-100">
          Explore published processes and share feedback
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchInput
            placeholder="Search published processes..."
            onChange={(value) => setSearch(value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={CATEGORIES}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="All Categories"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Published</TabsTrigger>
          <TabsTrigger value="public">Public</TabsTrigger>
          <TabsTrigger value="internal">Internal</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-500">
                Loading publications...
              </span>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="h-12 w-12 text-red-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Failed to load publications
              </h3>
              <p className="mt-2 text-sm text-gray-500">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={fetchPublications}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && publications.length === 0 && <EmptyState />}

          {/* Process Grid */}
          {!loading && !error && publications.length > 0 && (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {publications.map((pub) => {
                  const avgRating = getAverageRating(pub.feedbacks || []);
                  return (
                    <Card
                      key={pub.id}
                      className="group overflow-hidden transition-shadow hover:shadow-md"
                    >
                      {/* Thumbnail */}
                      <div className="flex h-40 items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 border-b border-gray-100">
                        <Workflow className="h-16 w-16 text-gray-300 group-hover:text-blue-400 transition-colors" />
                      </div>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 line-clamp-1">
                            {pub.title}
                          </h3>
                          <Badge variant={pub.isPublic ? 'info' : 'default'}>
                            {pub.isPublic ? 'Public' : 'Internal'}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                          {pub.description || 'No description provided.'}
                        </p>
                        <div className="mt-3">
                          <StarRating rating={avgRating} />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                          <span>
                            By{' '}
                            {pub.publishedBy
                              ? `${pub.publishedBy.firstName} ${pub.publishedBy.lastName}`
                              : 'Unknown'}
                          </span>
                          <span>{formatDate(pub.publishedAt)}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {pub.viewCount} views
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5" />
                            {pub.feedbacks?.length || 0} reviews
                          </span>
                        </div>
                        <Link
                          href={`/collaboration/${pub.id}`}
                          className="mt-4 block"
                        >
                          <Button variant="outline" className="w-full" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center pt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
