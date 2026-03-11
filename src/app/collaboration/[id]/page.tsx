'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Star,
  Eye,
  Download,
  FileDown,
  ArrowLeft,
  Calendar,
  Tag,
  User,
  Workflow,
  Loader2,
  AlertCircle,
  Send,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/ui/avatar';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { PublicationData, FeedbackData } from '@/types';

function StarRatingDisplay({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'h-6 w-6' : size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= Math.round(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="focus:outline-none"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
        >
          <Star
            className={`h-7 w-7 transition-colors ${
              star <= (hovered || value)
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200 hover:fill-yellow-200 hover:text-yellow-200'
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-500">
        {value > 0 ? `${value} star${value !== 1 ? 's' : ''}` : 'Select rating'}
      </span>
    </div>
  );
}

export default function PublicationDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [publication, setPublication] = useState<PublicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Feedback form
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchPublication = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/collaboration/${id}`);
      if (!res.ok) throw new Error('Failed to fetch publication');
      const data = await res.json();
      setPublication(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPublication();
  }, [fetchPublication]);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackRating === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      const res = await fetch(`/api/collaboration/${id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: feedbackRating, comment: feedbackComment }),
      });
      if (!res.ok) throw new Error('Failed to submit feedback');
      setSubmitSuccess(true);
      setFeedbackRating(0);
      setFeedbackComment('');
      fetchPublication();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = (format: string) => {
    if (!publication) return;
    const content =
      format === 'xml'
        ? publication.process?.bpmnXml || '<bpmn/>'
        : JSON.stringify(publication, null, 2);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${publication.title}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-500">Loading publication...</span>
      </div>
    );
  }

  if (error || !publication) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          {error || 'Publication not found'}
        </h3>
        <Link href="/collaboration" className="mt-4">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Hub
          </Button>
        </Link>
      </div>
    );
  }

  const feedbacks = publication.feedbacks || [];
  const avgRating =
    feedbacks.length > 0
      ? feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/collaboration"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Collaboration Hub
      </Link>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Process Viewer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Process Viewer / Placeholder */}
          <Card>
            <div className="flex h-80 items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-lg">
              {publication.process?.svgThumbnail ? (
                <div
                  className="h-full w-full p-4"
                  dangerouslySetInnerHTML={{
                    __html: publication.process.svgThumbnail,
                  }}
                />
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <Workflow className="h-20 w-20" />
                  <p className="mt-3 text-sm">BPMN Process Diagram</p>
                </div>
              )}
            </div>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {publication.title}
                  </h1>
                  <p className="mt-2 text-gray-600">
                    {publication.description || 'No description provided.'}
                  </p>
                </div>
                <Badge variant={publication.isPublic ? 'info' : 'default'}>
                  {publication.isPublic ? 'Public' : 'Internal'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Feedback Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Feedback ({feedbacks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Average Rating */}
              <div className="mb-6 flex items-center gap-4 rounded-lg bg-gray-50 p-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">
                    {avgRating > 0 ? avgRating.toFixed(1) : '--'}
                  </div>
                  <div className="text-sm text-gray-500">out of 5</div>
                </div>
                <div>
                  <StarRatingDisplay rating={avgRating} size="lg" />
                  <p className="mt-1 text-sm text-gray-500">
                    Based on {feedbacks.length} review
                    {feedbacks.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Feedback List */}
              {feedbacks.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">
                  No feedback yet. Be the first to leave a review!
                </p>
              ) : (
                <div className="space-y-4">
                  {feedbacks.map((fb) => (
                    <div
                      key={fb.id}
                      className="rounded-lg border border-gray-100 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={`${fb.user.firstName} ${fb.user.lastName}`}
                            size="sm"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {fb.user.firstName} {fb.user.lastName}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDate(fb.createdAt)}
                            </p>
                          </div>
                        </div>
                        <StarRatingDisplay rating={fb.rating} size="sm" />
                      </div>
                      {fb.comment && (
                        <p className="mt-3 text-sm text-gray-600">
                          {fb.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Leave Feedback Form */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">
                  Leave Feedback
                </h4>
                {submitSuccess && (
                  <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                    Feedback submitted successfully!
                  </div>
                )}
                {submitError && (
                  <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {submitError}
                  </div>
                )}
                <form onSubmit={handleSubmitFeedback} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Rating
                    </label>
                    <StarRatingInput
                      value={feedbackRating}
                      onChange={setFeedbackRating}
                    />
                  </div>
                  <Textarea
                    label="Comment"
                    placeholder="Share your thoughts about this process..."
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    rows={3}
                  />
                  <Button
                    type="submit"
                    loading={submitting}
                    disabled={feedbackRating === 0}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Submit Feedback
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Metadata & Actions */}
        <div className="space-y-6">
          {/* Published By */}
          <Card>
            <CardHeader>
              <CardTitle>Published By</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar
                  name={
                    publication.publishedBy
                      ? `${publication.publishedBy.firstName} ${publication.publishedBy.lastName}`
                      : 'Unknown'
                  }
                  size="lg"
                />
                <div>
                  <p className="font-medium text-gray-900">
                    {publication.publishedBy
                      ? `${publication.publishedBy.firstName} ${publication.publishedBy.lastName}`
                      : 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(publication.publishedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Process Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Process Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Tag className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Category:</span>
                <Badge>{publication.process?.category || 'General'}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Published:</span>
                <span className="text-gray-700">
                  {formatDateTime(publication.publishedAt)}
                </span>
              </div>
              {publication.expiresAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Expires:</span>
                  <span className="text-gray-700">
                    {formatDate(publication.expiresAt)}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Views:</span>
                <span className="text-gray-700">{publication.viewCount}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Rating:</span>
                <span className="text-gray-700">
                  {avgRating > 0 ? avgRating.toFixed(1) : 'No ratings'} (
                  {feedbacks.length})
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Download / Export */}
          <Card>
            <CardHeader>
              <CardTitle>Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleExport('xml')}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Download BPMN XML
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleExport('json')}
              >
                <Download className="mr-2 h-4 w-4" />
                Export as JSON
              </Button>
            </CardContent>
          </Card>

          {/* Related Processes Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Related Processes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-400 text-center py-4">
                No related processes available.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
