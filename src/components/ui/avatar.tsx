'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const avatarVariants = cva(
  'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200',
  {
    variants: {
      size: {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-14 w-14 text-lg',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

const FALLBACK_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-cyan-500',
];

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string | null;
  alt?: string;
  initials?: string;
  name?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  className,
  size,
  src,
  alt = '',
  initials,
  name,
  ...props
}) => {
  const [imgError, setImgError] = React.useState(false);

  const fallbackInitials =
    initials ||
    (name
      ? name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : '?');

  const colorClass = name ? getColorFromName(name) : 'bg-gray-400';

  const showImage = src && !imgError;

  return (
    <div
      className={cn(
        avatarVariants({ size }),
        !showImage && colorClass,
        className
      )}
      {...props}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || name || ''}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="font-medium text-white">{fallbackInitials}</span>
      )}
    </div>
  );
};
Avatar.displayName = 'Avatar';

export { Avatar, avatarVariants };
