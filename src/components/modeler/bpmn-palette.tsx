'use client';

import React from 'react';
import {
  Circle,
  Square,
  Diamond,
  Layers,
  MessageSquare,
  Database,
  FileText,
  Boxes,
  ArrowRight,
  Type,
} from 'lucide-react';

interface PaletteItem {
  type: string;
  label: string;
  icon: React.ElementType;
  category: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultName: string;
}

const paletteItems: PaletteItem[] = [
  // Events
  { type: 'startEvent', label: 'Start Event', icon: Circle, category: 'Events', defaultWidth: 36, defaultHeight: 36, defaultName: 'Start' },
  { type: 'endEvent', label: 'End Event', icon: Circle, category: 'Events', defaultWidth: 36, defaultHeight: 36, defaultName: 'End' },
  { type: 'intermediateEvent', label: 'Intermediate', icon: Circle, category: 'Events', defaultWidth: 36, defaultHeight: 36, defaultName: 'Event' },

  // Tasks
  { type: 'task', label: 'Task', icon: Square, category: 'Tasks', defaultWidth: 120, defaultHeight: 60, defaultName: 'Task' },
  { type: 'userTask', label: 'User Task', icon: Square, category: 'Tasks', defaultWidth: 120, defaultHeight: 60, defaultName: 'User Task' },
  { type: 'serviceTask', label: 'Service Task', icon: Square, category: 'Tasks', defaultWidth: 120, defaultHeight: 60, defaultName: 'Service Task' },
  { type: 'scriptTask', label: 'Script Task', icon: Square, category: 'Tasks', defaultWidth: 120, defaultHeight: 60, defaultName: 'Script Task' },
  { type: 'sendTask', label: 'Send Task', icon: Square, category: 'Tasks', defaultWidth: 120, defaultHeight: 60, defaultName: 'Send Task' },
  { type: 'receiveTask', label: 'Receive Task', icon: Square, category: 'Tasks', defaultWidth: 120, defaultHeight: 60, defaultName: 'Receive Task' },
  { type: 'manualTask', label: 'Manual Task', icon: Square, category: 'Tasks', defaultWidth: 120, defaultHeight: 60, defaultName: 'Manual Task' },
  { type: 'businessRuleTask', label: 'Business Rule', icon: Square, category: 'Tasks', defaultWidth: 120, defaultHeight: 60, defaultName: 'Business Rule' },

  // Gateways
  { type: 'exclusiveGateway', label: 'Exclusive (XOR)', icon: Diamond, category: 'Gateways', defaultWidth: 50, defaultHeight: 50, defaultName: '' },
  { type: 'parallelGateway', label: 'Parallel (AND)', icon: Diamond, category: 'Gateways', defaultWidth: 50, defaultHeight: 50, defaultName: '' },
  { type: 'inclusiveGateway', label: 'Inclusive (OR)', icon: Diamond, category: 'Gateways', defaultWidth: 50, defaultHeight: 50, defaultName: '' },
  { type: 'eventBasedGateway', label: 'Event-Based', icon: Diamond, category: 'Gateways', defaultWidth: 50, defaultHeight: 50, defaultName: '' },

  // Containers
  { type: 'subProcess', label: 'Sub-Process', icon: Boxes, category: 'Containers', defaultWidth: 200, defaultHeight: 120, defaultName: 'Sub-Process' },
  { type: 'callActivity', label: 'Call Activity', icon: Boxes, category: 'Containers', defaultWidth: 120, defaultHeight: 60, defaultName: 'Call Activity' },
  { type: 'pool', label: 'Pool', icon: Layers, category: 'Containers', defaultWidth: 600, defaultHeight: 250, defaultName: 'Pool' },
  { type: 'lane', label: 'Lane', icon: Layers, category: 'Containers', defaultWidth: 570, defaultHeight: 125, defaultName: 'Lane' },

  // Data & Artifacts
  { type: 'dataObject', label: 'Data Object', icon: FileText, category: 'Data', defaultWidth: 36, defaultHeight: 50, defaultName: 'Data' },
  { type: 'dataStore', label: 'Data Store', icon: Database, category: 'Data', defaultWidth: 50, defaultHeight: 50, defaultName: 'Data Store' },
  { type: 'textAnnotation', label: 'Annotation', icon: Type, category: 'Data', defaultWidth: 120, defaultHeight: 40, defaultName: 'Note' },
  { type: 'group', label: 'Group', icon: Boxes, category: 'Data', defaultWidth: 250, defaultHeight: 180, defaultName: 'Group' },
];

const categories = ['Events', 'Tasks', 'Gateways', 'Containers', 'Data'];

// Mini SVG previews for each element type
function ElementPreview({ type }: { type: string }) {
  const size = 24;
  const cx = size / 2;
  const cy = size / 2;

  switch (type) {
    case 'startEvent':
      return (
        <svg width={size} height={size}>
          <circle cx={cx} cy={cy} r={9} fill="#d4edda" stroke="#28a745" strokeWidth={2} />
        </svg>
      );
    case 'endEvent':
      return (
        <svg width={size} height={size}>
          <circle cx={cx} cy={cy} r={9} fill="#f8d7da" stroke="#dc3545" strokeWidth={3} />
        </svg>
      );
    case 'intermediateEvent':
      return (
        <svg width={size} height={size}>
          <circle cx={cx} cy={cy} r={9} fill="#fff3cd" stroke="#ffc107" strokeWidth={2} />
          <circle cx={cx} cy={cy} r={6} fill="none" stroke="#ffc107" strokeWidth={1} />
        </svg>
      );
    case 'task':
    case 'userTask':
    case 'serviceTask':
    case 'scriptTask':
    case 'sendTask':
    case 'receiveTask':
    case 'manualTask':
    case 'businessRuleTask':
      return (
        <svg width={size} height={size}>
          <rect x={2} y={4} width={20} height={16} rx={3} fill="white" stroke="#333" strokeWidth={1.5} />
        </svg>
      );
    case 'exclusiveGateway':
    case 'parallelGateway':
    case 'inclusiveGateway':
    case 'eventBasedGateway':
      return (
        <svg width={size} height={size}>
          <polygon points={`${cx},2 ${size - 2},${cy} ${cx},${size - 2} 2,${cy}`} fill="#fff8e1" stroke="#333" strokeWidth={1.5} />
        </svg>
      );
    case 'subProcess':
    case 'callActivity':
      return (
        <svg width={size} height={size}>
          <rect x={2} y={4} width={20} height={16} rx={3} fill="white" stroke="#333" strokeWidth={type === 'callActivity' ? 2.5 : 1.5} />
          <line x1={cx} y1={15} x2={cx} y2={19} stroke="#555" strokeWidth={1} />
          <line x1={cx - 2} y1={17} x2={cx + 2} y2={17} stroke="#555" strokeWidth={1} />
        </svg>
      );
    case 'pool':
    case 'lane':
      return (
        <svg width={size} height={size}>
          <rect x={2} y={4} width={20} height={16} fill="#f0f4f8" stroke="#333" strokeWidth={1.5} />
          <rect x={2} y={4} width={5} height={16} fill="#dde4ed" stroke="#333" strokeWidth={0.5} />
        </svg>
      );
    case 'dataObject':
      return (
        <svg width={size} height={size}>
          <path d="M4 2 L18 2 L22 6 L22 22 L4 22 Z" fill="white" stroke="#333" strokeWidth={1.5} />
          <path d="M18 2 L18 6 L22 6" fill="none" stroke="#333" strokeWidth={1} />
        </svg>
      );
    case 'dataStore':
      return (
        <svg width={size} height={size}>
          <ellipse cx={cx} cy={6} rx={9} ry={3} fill="#f0f0f0" stroke="#333" strokeWidth={1.5} />
          <path d={`M3 6 L3 18 Q3 22 ${cx} 22 Q21 22 21 18 L21 6`} fill="white" stroke="#333" strokeWidth={1.5} />
        </svg>
      );
    case 'textAnnotation':
      return (
        <svg width={size} height={size}>
          <path d="M8 3 L3 3 L3 21 L8 21" fill="none" stroke="#333" strokeWidth={1.5} />
          <line x1={6} y1={9} x2={20} y2={9} stroke="#aaa" strokeWidth={0.8} />
          <line x1={6} y1={12} x2={18} y2={12} stroke="#aaa" strokeWidth={0.8} />
          <line x1={6} y1={15} x2={16} y2={15} stroke="#aaa" strokeWidth={0.8} />
        </svg>
      );
    case 'group':
      return (
        <svg width={size} height={size}>
          <rect x={2} y={4} width={20} height={16} rx={3} fill="none" stroke="#999" strokeWidth={1.5} strokeDasharray="4 2" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size}>
          <rect x={2} y={4} width={20} height={16} rx={2} fill="#eee" stroke="#999" strokeWidth={1} />
        </svg>
      );
  }
}

export default function BpmnPalette() {
  const handleDragStart = (e: React.DragEvent, item: PaletteItem) => {
    e.dataTransfer.setData(
      'application/bpmn-element',
      JSON.stringify({
        type: item.type,
        defaultWidth: item.defaultWidth,
        defaultHeight: item.defaultHeight,
        defaultName: item.defaultName,
      })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="flex h-full w-56 flex-col border-r border-gray-200 bg-white overflow-y-auto">
      <div className="border-b border-gray-100 px-3 py-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Elements
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {categories.map((category) => {
          const items = paletteItems.filter((item) => item.category === category);
          return (
            <div key={category} className="mb-1">
              <div className="px-3 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  {category}
                </span>
              </div>
              <div className="space-y-px px-1">
                {items.map((item) => (
                  <div
                    key={item.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    className="flex items-center gap-2.5 rounded-md px-2 py-1.5 cursor-grab text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 active:cursor-grabbing transition-colors"
                    title={`Drag to canvas: ${item.label}`}
                  >
                    <ElementPreview type={item.type} />
                    <span className="text-xs">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
