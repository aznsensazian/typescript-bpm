'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Loader2,
  AlertCircle,
  Search,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { formatDate } from '@/lib/utils';

interface DictionaryEntry {
  id: string;
  term: string;
  definition: string;
  category: string | null;
  createdBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'BPMN', label: 'BPMN' },
  { value: 'Business', label: 'Business' },
  { value: 'Technical', label: 'Technical' },
  { value: 'Compliance', label: 'Compliance' },
  { value: 'General', label: 'General' },
];

export default function DictionaryPage() {
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [formTerm, setFormTerm] = useState('');
  const [formDefinition, setFormDefinition] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (category) params.set('category', category);

      const res = await fetch(`/api/dictionary?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch dictionary');
      const data = await res.json();
      setEntries(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, category]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, category]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formTerm.trim() || !formDefinition.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/dictionary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: formTerm.trim(),
          definition: formDefinition.trim(),
          category: formCategory || null,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setFormTerm('');
        setFormDefinition('');
        setFormCategory('');
        fetchEntries();
      }
    } catch {
      // Handle error
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entryId: string) {
    if (!confirm('Delete this dictionary entry?')) return;
    try {
      await fetch(`/api/dictionary/${entryId}`, { method: 'DELETE' });
      fetchEntries();
    } catch {
      // Handle error
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Process Dictionary</h1>
        </div>
        <p className="text-blue-100 text-lg">Shared glossary of process terms and definitions</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center flex-1">
          <div className="flex-1">
            <SearchInput placeholder="Search terms..." onChange={(v) => setSearch(v)} />
          </div>
          <div className="w-full sm:w-48">
            <Select options={CATEGORIES} value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Term
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
          <Button variant="outline" className="mt-4" onClick={fetchEntries}>Retry</Button>
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <BookOpen className="h-16 w-16 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No entries found</h3>
          <p className="mt-2 text-sm text-gray-500">Add your first term to the dictionary.</p>
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <>
          <div className="space-y-3">
            {entries.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{entry.term}</h3>
                        {entry.category && <Badge variant="outline">{entry.category}</Badge>}
                      </div>
                      <p className="mt-2 text-sm text-gray-600">{entry.definition}</p>
                      <p className="mt-2 text-xs text-gray-400">
                        Added by {entry.createdBy.firstName} {entry.createdBy.lastName} &middot;{' '}
                        {formatDate(entry.createdAt)}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </>
      )}

      {showModal && (
        <Modal open={showModal} title="Add Dictionary Entry" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Term *</label>
              <Input value={formTerm} onChange={(e) => setFormTerm(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Definition *</label>
              <Textarea value={formDefinition} onChange={(e) => setFormDefinition(e.target.value)} rows={4} required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Category</label>
              <Select options={CATEGORIES} value={formCategory} onChange={(e) => setFormCategory(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Add Entry</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
