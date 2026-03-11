'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  className?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  className,
}) => (
  <Modal open={open} onClose={onClose} className={className}>
    <div className="flex gap-4">
      {destructive && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
      )}
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-500">{message}</p>
      </div>
    </div>
    <div className="mt-6 flex justify-end gap-3">
      <Button variant="outline" onClick={onClose} disabled={loading}>
        {cancelLabel}
      </Button>
      <Button
        variant={destructive ? 'destructive' : 'default'}
        onClick={onConfirm}
        loading={loading}
      >
        {confirmLabel}
      </Button>
    </div>
  </Modal>
);
ConfirmDialog.displayName = 'ConfirmDialog';

export { ConfirmDialog };
