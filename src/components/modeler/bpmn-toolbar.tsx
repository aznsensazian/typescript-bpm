'use client';

import React from 'react';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3X3,
  Magnet,
  Trash2,
  Save,
  Download,
  Upload,
} from 'lucide-react';
import { useModelerStore } from '@/store/modeler-store';
import { cn } from '@/lib/utils';

interface BpmnToolbarProps {
  onSave?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  processName?: string;
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  active,
  variant,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  variant?: 'danger';
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        'flex items-center justify-center rounded-md p-2 text-sm transition-colors',
        disabled
          ? 'cursor-not-allowed text-gray-300'
          : active
          ? 'bg-blue-100 text-blue-700'
          : variant === 'danger'
          ? 'text-gray-500 hover:bg-red-50 hover:text-red-600'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function ToolbarSeparator() {
  return <div className="mx-1 h-6 w-px bg-gray-200" />;
}

export default function BpmnToolbar({ onSave, onExport, onImport }: BpmnToolbarProps) {
  const {
    zoom,
    gridVisible,
    snapToGrid,
    isDirty,
    undoStack,
    redoStack,
    processName,
    setZoom,
    setPan,
    toggleGrid,
    toggleSnap,
    clearCanvas,
    undo,
    redo,
    setProcessName,
  } = useModelerStore();

  const handleZoomIn = () => setZoom(zoom + 0.1);
  const handleZoomOut = () => setZoom(zoom - 0.1);
  const handleFitView = () => {
    setZoom(1);
    setPan(0, 0);
  };

  const handleClear = () => {
    if (confirm('Clear the entire canvas? This action can be undone.')) {
      clearCanvas();
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-3 py-1.5">
      {/* Left section: Process name + Undo/Redo */}
      <div className="flex items-center gap-2">
        <input
          className="w-48 rounded border border-transparent px-2 py-1 text-sm font-medium text-gray-900 hover:border-gray-300 focus:border-blue-500 focus:outline-none"
          value={processName}
          onChange={(e) => setProcessName(e.target.value)}
          placeholder="Process name..."
        />

        {isDirty && (
          <span className="text-xs text-amber-500 font-medium">Unsaved</span>
        )}

        <ToolbarSeparator />

        <ToolbarButton
          icon={Undo2}
          label="Undo (Ctrl+Z)"
          onClick={undo}
          disabled={undoStack.length === 0}
        />
        <ToolbarButton
          icon={Redo2}
          label="Redo (Ctrl+Y)"
          onClick={redo}
          disabled={redoStack.length === 0}
        />
      </div>

      {/* Center section: Zoom + View */}
      <div className="flex items-center gap-1">
        <ToolbarButton icon={ZoomOut} label="Zoom Out" onClick={handleZoomOut} disabled={zoom <= 0.2} />
        <span className="w-12 text-center text-xs font-medium text-gray-500">
          {Math.round(zoom * 100)}%
        </span>
        <ToolbarButton icon={ZoomIn} label="Zoom In" onClick={handleZoomIn} disabled={zoom >= 3} />
        <ToolbarButton icon={Maximize2} label="Fit to View" onClick={handleFitView} />

        <ToolbarSeparator />

        <ToolbarButton
          icon={Grid3X3}
          label="Toggle Grid"
          onClick={toggleGrid}
          active={gridVisible}
        />
        <ToolbarButton
          icon={Magnet}
          label="Snap to Grid"
          onClick={toggleSnap}
          active={snapToGrid}
        />
      </div>

      {/* Right section: Actions */}
      <div className="flex items-center gap-1">
        {onImport && (
          <ToolbarButton icon={Upload} label="Import BPMN" onClick={onImport} />
        )}
        {onExport && (
          <ToolbarButton icon={Download} label="Export BPMN" onClick={onExport} />
        )}

        <ToolbarSeparator />

        <ToolbarButton
          icon={Trash2}
          label="Clear Canvas"
          onClick={handleClear}
          variant="danger"
        />

        {onSave && (
          <>
            <ToolbarSeparator />
            <button
              onClick={onSave}
              className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </button>
          </>
        )}
      </div>
    </div>
  );
}
