'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

const spinnerSizes = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  ...props
}) => (
  <div
    className={cn('flex items-center justify-center', className)}
    role="status"
    aria-label="Loading"
    {...props}
  >
    <Loader2 className={cn('animate-spin text-blue-600', spinnerSizes[size])} />
  </div>
);
LoadingSpinner.displayName = 'LoadingSpinner';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <div
    className={cn('animate-pulse rounded-md bg-gray-200', className)}
    aria-hidden="true"
    {...props}
  />
);
Skeleton.displayName = 'Skeleton';

export { LoadingSpinner, Skeleton };
