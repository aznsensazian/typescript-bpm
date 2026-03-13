'use client';

import React, { useState } from 'react';
import { X, Trash2, Palette, Type, Link2, Info, ChevronDown, ChevronRight } from 'lucide-react';
import { useModelerStore, BpmnNode, BpmnConnection } from '@/store/modeler-store';
import { cn } from '@/lib/utils';

const NODE_TYPE_LABELS: Record<string, string> = {
  startEvent: 'Start Event',
  endEvent: 'End Event',
  intermediateEvent: 'Intermediate Event',
  task: 'Task',
  userTask: 'User Task',
  serviceTask: 'Service Task',
  scriptTask: 'Script Task',
  sendTask: 'Send Task',
  receiveTask: 'Receive Task',
  manualTask: 'Manual Task',
  businessRuleTask: 'Business Rule Task',
  exclusiveGateway: 'Exclusive Gateway',
  parallelGateway: 'Parallel Gateway',
  inclusiveGateway: 'Inclusive Gateway',
  eventBasedGateway: 'Event-Based Gateway',
  complexGateway: 'Complex Gateway',
  subProcess: 'Sub-Process',
  callActivity: 'Call Activity',
  pool: 'Pool',
  lane: 'Lane',
  dataObject: 'Data Object',
  dataStore: 'Data Store',
  textAnnotation: 'Text Annotation',
  group: 'Group',
};

const TASK_TYPES = [
  { value: 'task', label: 'Task' },
  { value: 'userTask', label: 'User Task' },
  { value: 'serviceTask', label: 'Service Task' },
  { value: 'scriptTask', label: 'Script Task' },
  { value: 'sendTask', label: 'Send Task' },
  { value: 'receiveTask', label: 'Receive Task' },
  { value: 'manualTask', label: 'Manual Task' },
  { value: 'businessRuleTask', label: 'Business Rule Task' },
];

const GATEWAY_TYPES = [
  { value: 'exclusiveGateway', label: 'Exclusive (XOR)' },
  { value: 'parallelGateway', label: 'Parallel (AND)' },
  { value: 'inclusiveGateway', label: 'Inclusive (OR)' },
  { value: 'eventBasedGateway', label: 'Event-Based' },
  { value: 'complexGateway', label: 'Complex' },
];

const EVENT_TYPES = [
  { value: 'startEvent', label: 'Start Event' },
  { value: 'endEvent', label: 'End Event' },
  { value: 'intermediateEvent', label: 'Intermediate Event' },
];

const COLORS = [
  { value: '', label: 'Default' },
  { value: '#dbeafe', label: 'Blue' },
  { value: '#dcfce7', label: 'Green' },
  { value: '#fef3c7', label: 'Yellow' },
  { value: '#fce7f3', label: 'Pink' },
  { value: '#f3e8ff', label: 'Purple' },
  { value: '#fed7aa', label: 'Orange' },
  { value: '#e5e7eb', label: 'Gray' },
];

function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:bg-gray-50"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <Icon className="h-3.5 w-3.5" />
        {title}
      </button>
      {open && <div className="px-4 pb-3 space-y-3">{children}</div>}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-gray-600 mb-1">{children}</label>;
}

function NodeProperties({ node }: { node: BpmnNode }) {
  const { updateNode, removeNode, selectNode } = useModelerStore();

  const isTask = [
    'task', 'userTask', 'serviceTask', 'scriptTask',
    'sendTask', 'receiveTask', 'manualTask', 'businessRuleTask',
  ].includes(node.type);

  const isGateway = [
    'exclusiveGateway', 'parallelGateway', 'inclusiveGateway',
    'eventBasedGateway', 'complexGateway',
  ].includes(node.type);

  const isEvent = ['startEvent', 'endEvent', 'intermediateEvent'].includes(node.type);

  const handleTypeChange = (newType: string) => {
    updateNode(node.id, { type: newType });
  };

  const handleDelete = () => {
    removeNode(node.id);
    selectNode(null);
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {NODE_TYPE_LABELS[node.type] || node.type}
          </p>
          <p className="text-[10px] text-gray-400 font-mono truncate">{node.id.slice(0, 8)}</p>
        </div>
        <button
          onClick={handleDelete}
          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          title="Delete element"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* General */}
      <Section title="General" icon={Info}>
        <div>
          <FieldLabel>Name</FieldLabel>
          <input
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            value={node.name}
            onChange={(e) => updateNode(node.id, { name: e.target.value })}
            placeholder="Element name..."
          />
        </div>

        {/* Type selector for tasks, gateways, events */}
        {isTask && (
          <div>
            <FieldLabel>Task Type</FieldLabel>
            <select
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm bg-white focus:border-blue-500 focus:outline-none"
              value={node.type}
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              {TASK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        )}

        {isGateway && (
          <div>
            <FieldLabel>Gateway Type</FieldLabel>
            <select
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm bg-white focus:border-blue-500 focus:outline-none"
              value={node.type}
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              {GATEWAY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        )}

        {isEvent && (
          <div>
            <FieldLabel>Event Type</FieldLabel>
            <select
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm bg-white focus:border-blue-500 focus:outline-none"
              value={node.type}
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Documentation */}
        <div>
          <FieldLabel>Documentation</FieldLabel>
          <textarea
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none resize-none"
            rows={3}
            value={(node.properties.documentation as string) || ''}
            onChange={(e) =>
              updateNode(node.id, {
                properties: { ...node.properties, documentation: e.target.value },
              })
            }
            placeholder="Add documentation..."
          />
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Appearance" icon={Palette} defaultOpen={false}>
        <div>
          <FieldLabel>Color</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() =>
                  updateNode(node.id, {
                    properties: { ...node.properties, color: color.value || undefined },
                  })
                }
                className={cn(
                  'h-6 w-6 rounded border-2 transition-all',
                  (node.properties.color || '') === color.value
                    ? 'border-blue-500 ring-1 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-400'
                )}
                style={{ backgroundColor: color.value || '#fff' }}
                title={color.label}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <FieldLabel>Width</FieldLabel>
            <input
              type="number"
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              value={node.width}
              onChange={(e) => updateNode(node.id, { width: parseInt(e.target.value) || node.width })}
              min={20}
            />
          </div>
          <div>
            <FieldLabel>Height</FieldLabel>
            <input
              type="number"
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              value={node.height}
              onChange={(e) => updateNode(node.id, { height: parseInt(e.target.value) || node.height })}
              min={20}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <FieldLabel>X</FieldLabel>
            <input
              type="number"
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              value={Math.round(node.x)}
              onChange={(e) => updateNode(node.id, { x: parseInt(e.target.value) || node.x })}
            />
          </div>
          <div>
            <FieldLabel>Y</FieldLabel>
            <input
              type="number"
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              value={Math.round(node.y)}
              onChange={(e) => updateNode(node.id, { y: parseInt(e.target.value) || node.y })}
            />
          </div>
        </div>
      </Section>

      {/* Custom Properties */}
      <Section title="Properties" icon={Type} defaultOpen={false}>
        {isTask && (
          <>
            <div>
              <FieldLabel>Assignee</FieldLabel>
              <input
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                value={(node.properties.assignee as string) || ''}
                onChange={(e) =>
                  updateNode(node.id, {
                    properties: { ...node.properties, assignee: e.target.value },
                  })
                }
                placeholder="e.g., ${user}"
              />
            </div>
            <div>
              <FieldLabel>Due Date</FieldLabel>
              <input
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                value={(node.properties.dueDate as string) || ''}
                onChange={(e) =>
                  updateNode(node.id, {
                    properties: { ...node.properties, dueDate: e.target.value },
                  })
                }
                placeholder="e.g., P3D"
              />
            </div>
            <div>
              <FieldLabel>Priority</FieldLabel>
              <select
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm bg-white focus:border-blue-500 focus:outline-none"
                value={(node.properties.priority as string) || ''}
                onChange={(e) =>
                  updateNode(node.id, {
                    properties: { ...node.properties, priority: e.target.value },
                  })
                }
              >
                <option value="">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </>
        )}

        {node.type === 'serviceTask' && (
          <div>
            <FieldLabel>Service URL</FieldLabel>
            <input
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              value={(node.properties.serviceUrl as string) || ''}
              onChange={(e) =>
                updateNode(node.id, {
                  properties: { ...node.properties, serviceUrl: e.target.value },
                })
              }
              placeholder="https://api.example.com/..."
            />
          </div>
        )}

        {node.type === 'scriptTask' && (
          <div>
            <FieldLabel>Script</FieldLabel>
            <textarea
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm font-mono focus:border-blue-500 focus:outline-none resize-none"
              rows={4}
              value={(node.properties.script as string) || ''}
              onChange={(e) =>
                updateNode(node.id, {
                  properties: { ...node.properties, script: e.target.value },
                })
              }
              placeholder="// JavaScript"
            />
          </div>
        )}

        {!isTask && !isGateway && !isEvent && (
          <p className="text-xs text-gray-400">No additional properties for this element type.</p>
        )}
      </Section>
    </>
  );
}

function ConnectionProperties({ connection }: { connection: BpmnConnection }) {
  const { nodes, removeConnection, selectConnection } = useModelerStore();

  const source = nodes.find((n) => n.id === connection.sourceId);
  const target = nodes.find((n) => n.id === connection.targetId);

  const handleDelete = () => {
    removeConnection(connection.id);
    selectConnection(null);
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">
            {connection.type === 'sequenceFlow' ? 'Sequence Flow' : connection.type === 'messageFlow' ? 'Message Flow' : 'Association'}
          </p>
          <p className="text-[10px] text-gray-400 font-mono truncate">{connection.id.slice(0, 8)}</p>
        </div>
        <button
          onClick={handleDelete}
          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          title="Delete connection"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <Section title="Connection" icon={Link2}>
        <div>
          <FieldLabel>From</FieldLabel>
          <p className="text-sm text-gray-700">
            {source ? `${source.name || NODE_TYPE_LABELS[source.type]}` : 'Unknown'}
          </p>
        </div>
        <div>
          <FieldLabel>To</FieldLabel>
          <p className="text-sm text-gray-700">
            {target ? `${target.name || NODE_TYPE_LABELS[target.type]}` : 'Unknown'}
          </p>
        </div>
        <div>
          <FieldLabel>Label</FieldLabel>
          <input
            className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            value={connection.label || ''}
            onChange={(e) => {
              const conns = useModelerStore.getState().connections;
              useModelerStore.setState({
                connections: conns.map((c) =>
                  c.id === connection.id ? { ...c, label: e.target.value } : c
                ),
              });
            }}
            placeholder="Flow label..."
          />
        </div>
        {connection.type === 'sequenceFlow' && (
          <div>
            <FieldLabel>Condition Expression</FieldLabel>
            <input
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm font-mono focus:border-blue-500 focus:outline-none"
              value={connection.condition || ''}
              onChange={(e) => {
                const conns = useModelerStore.getState().connections;
                useModelerStore.setState({
                  connections: conns.map((c) =>
                    c.id === connection.id ? { ...c, condition: e.target.value } : c
                  ),
                });
              }}
              placeholder="${amount > 1000}"
            />
          </div>
        )}
      </Section>
    </>
  );
}

export default function BpmnPropertiesPanel() {
  const { selectedNodeId, selectedConnectionId, nodes, connections, selectNode, selectConnection } = useModelerStore();

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;
  const selectedConnection = selectedConnectionId ? connections.find((c) => c.id === selectedConnectionId) : null;

  const hasSelection = selectedNode || selectedConnection;

  return (
    <div className="flex h-full w-64 flex-col border-l border-gray-200 bg-white overflow-hidden">
      {!hasSelection ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          <Info className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">No element selected</p>
          <p className="mt-1 text-xs text-gray-400">
            Click on an element or connection to view and edit its properties
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {selectedNode && <NodeProperties node={selectedNode} />}
          {selectedConnection && <ConnectionProperties connection={selectedConnection} />}
        </div>
      )}
    </div>
  );
}
