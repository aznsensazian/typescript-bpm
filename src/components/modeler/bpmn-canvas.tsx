'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useModelerStore, BpmnNode } from '@/store/modeler-store';
import BpmnNodeRenderer from './bpmn-node-renderer';

const GRID_SIZE = 20;

export default function BpmnCanvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const {
    nodes,
    connections,
    selectedNodeId,
    selectedConnectionId,
    zoom,
    panX,
    panY,
    gridVisible,
    snapToGrid,
    isConnecting,
    connectingFrom,
    selectNode,
    selectConnection,
    updateNode,
    removeNode,
    removeConnection,
    setZoom,
    setPan,
    startConnecting,
    finishConnecting,
    cancelConnecting,
  } = useModelerStore();

  const snapValue = useCallback(
    (val: number) => {
      if (!snapToGrid) return val;
      return Math.round(val / GRID_SIZE) * GRID_SIZE;
    },
    [snapToGrid]
  );

  const screenToSvg = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgRef.current) return { x: clientX, y: clientY };
      const rect = svgRef.current.getBoundingClientRect();
      return {
        x: (clientX - rect.left - panX) / zoom,
        y: (clientY - rect.top - panY) / zoom,
      };
    },
    [zoom, panX, panY]
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (editingNodeId) return; // Don't intercept when editing

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          removeNode(selectedNodeId);
        } else if (selectedConnectionId) {
          removeConnection(selectedConnectionId);
        }
      }
      if (e.key === 'Escape') {
        selectNode(null);
        selectConnection(null);
        cancelConnecting();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedConnectionId, editingNodeId, removeNode, removeConnection, selectNode, selectConnection, cancelConnecting]);

  // Canvas background click — deselect
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === svgRef.current || (e.target as Element).classList.contains('canvas-bg')) {
        selectNode(null);
        selectConnection(null);
        if (isConnecting) cancelConnecting();

        // Start panning
        setIsPanning(true);
        setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
      }
    },
    [selectNode, selectConnection, isConnecting, cancelConnecting, panX, panY]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan(e.clientX - panStart.x, e.clientY - panStart.y);
        return;
      }

      if (draggingNodeId) {
        const pos = screenToSvg(e.clientX, e.clientY);
        updateNode(draggingNodeId, {
          x: snapValue(pos.x - dragOffset.x),
          y: snapValue(pos.y - dragOffset.y),
        });
      }
    },
    [isPanning, panStart, setPan, draggingNodeId, dragOffset, screenToSvg, updateNode, snapValue]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    if (draggingNodeId) {
      // Push history after drag finishes
      useModelerStore.getState().pushHistory();
      setDraggingNodeId(null);
    }
  }, [draggingNodeId]);

  // Wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(zoom + delta);
    },
    [zoom, setZoom]
  );

  // Node drag start
  const handleNodeMouseDown = useCallback(
    (nodeId: string) => (e: React.MouseEvent) => {
      e.stopPropagation();
      selectNode(nodeId);
      const pos = screenToSvg(e.clientX, e.clientY);
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        setDragOffset({ x: pos.x - node.x, y: pos.y - node.y });
        setDraggingNodeId(nodeId);
      }
    },
    [selectNode, screenToSvg, nodes]
  );

  // Node double-click — inline rename
  const handleNodeDoubleClick = useCallback(
    (nodeId: string) => (e: React.MouseEvent) => {
      e.stopPropagation();
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        setEditingNodeId(nodeId);
        setEditingName(node.name);
      }
    },
    [nodes]
  );

  const finishEditing = useCallback(() => {
    if (editingNodeId) {
      updateNode(editingNodeId, { name: editingName });
      setEditingNodeId(null);
    }
  }, [editingNodeId, editingName, updateNode]);

  // Connection click
  const handleConnectionClick = useCallback(
    (connId: string) => (e: React.MouseEvent) => {
      e.stopPropagation();
      selectConnection(connId);
      selectNode(null);
    },
    [selectConnection, selectNode]
  );

  // Drop handler for palette drag-drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const data = e.dataTransfer.getData('application/bpmn-element');
      if (!data) return;

      const { type, defaultWidth, defaultHeight, defaultName } = JSON.parse(data);
      const pos = screenToSvg(e.clientX, e.clientY);

      const newNode: BpmnNode = {
        id: crypto.randomUUID(),
        type,
        name: defaultName || type,
        x: snapValue(pos.x - defaultWidth / 2),
        y: snapValue(pos.y - defaultHeight / 2),
        width: defaultWidth,
        height: defaultHeight,
        properties: {},
      };

      useModelerStore.getState().addNode(newNode);
    },
    [screenToSvg, snapValue]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Render grid pattern
  const renderGrid = () => {
    if (!gridVisible) return null;
    return (
      <defs>
        <pattern id="grid-small" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
          <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="#e5e7eb" strokeWidth={0.5} />
        </pattern>
        <pattern id="grid-large" width={GRID_SIZE * 5} height={GRID_SIZE * 5} patternUnits="userSpaceOnUse">
          <rect width={GRID_SIZE * 5} height={GRID_SIZE * 5} fill="url(#grid-small)" />
          <path d={`M ${GRID_SIZE * 5} 0 L 0 0 0 ${GRID_SIZE * 5}`} fill="none" stroke="#d1d5db" strokeWidth={1} />
        </pattern>
      </defs>
    );
  };

  // Render connections
  const renderConnections = () => {
    return connections.map((conn) => {
      const source = nodes.find((n) => n.id === conn.sourceId);
      const target = nodes.find((n) => n.id === conn.targetId);
      if (!source || !target) return null;

      const sx = source.x + source.width / 2;
      const sy = source.y + source.height / 2;
      const tx = target.x + target.width / 2;
      const ty = target.y + target.height / 2;

      const isSelected = conn.id === selectedConnectionId;

      // Use waypoints if available, otherwise straight line
      const wp = conn.waypoints.length >= 2 ? conn.waypoints : [{ x: sx, y: sy }, { x: tx, y: ty }];
      const pathD = wp.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');

      const strokeColor = isSelected
        ? '#2563eb'
        : conn.type === 'messageFlow'
        ? '#888'
        : conn.type === 'association'
        ? '#aaa'
        : '#555';

      const strokeDash = conn.type === 'association' ? '4 3' : conn.type === 'messageFlow' ? '8 4' : undefined;

      // Arrow marker id
      const markerId = `arrow-${conn.id}`;

      return (
        <g key={conn.id} onClick={handleConnectionClick(conn.id)} style={{ cursor: 'pointer' }}>
          <defs>
            <marker
              id={markerId}
              markerWidth={10}
              markerHeight={7}
              refX={10}
              refY={3.5}
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill={strokeColor} />
            </marker>
          </defs>
          {/* Invisible wider path for easier clicking */}
          <path d={pathD} fill="none" stroke="transparent" strokeWidth={12} />
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth={isSelected ? 2.5 : 1.5}
            strokeDasharray={strokeDash}
            markerEnd={`url(#${markerId})`}
          />
          {conn.label && (
            <text
              x={(wp[0].x + wp[wp.length - 1].x) / 2}
              y={(wp[0].y + wp[wp.length - 1].y) / 2 - 6}
              textAnchor="middle"
              fontSize={10}
              fill="#666"
            >
              {conn.label}
            </text>
          )}
        </g>
      );
    });
  };

  return (
    <div className="relative flex-1 overflow-hidden bg-white">
      <svg
        ref={svgRef}
        className="h-full w-full"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{ cursor: isPanning ? 'grabbing' : isConnecting ? 'crosshair' : 'default' }}
      >
        {renderGrid()}

        <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
          {/* Grid background */}
          {gridVisible && (
            <rect
              className="canvas-bg"
              x={-5000}
              y={-5000}
              width={10000}
              height={10000}
              fill="url(#grid-large)"
            />
          )}
          {!gridVisible && (
            <rect
              className="canvas-bg"
              x={-5000}
              y={-5000}
              width={10000}
              height={10000}
              fill="white"
            />
          )}

          {/* Connections */}
          {renderConnections()}

          {/* Nodes */}
          {nodes.map((node) => (
            <BpmnNodeRenderer
              key={node.id}
              node={node}
              isSelected={node.id === selectedNodeId}
              onMouseDown={handleNodeMouseDown(node.id)}
              onDoubleClick={handleNodeDoubleClick(node.id)}
              isConnecting={isConnecting}
              onConnectionStart={startConnecting}
              onConnectionEnd={finishConnecting}
            />
          ))}
        </g>
      </svg>

      {/* Inline editing overlay */}
      {editingNodeId && (() => {
        const node = nodes.find((n) => n.id === editingNodeId);
        if (!node) return null;
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return null;
        const screenX = rect.left + panX + node.x * zoom;
        const screenY = rect.top + panY + node.y * zoom;

        return (
          <div
            className="absolute z-50"
            style={{
              left: screenX,
              top: screenY,
              width: node.width * zoom,
              height: node.height * zoom,
            }}
          >
            <input
              autoFocus
              className="h-full w-full border-2 border-blue-500 bg-white px-1 text-center text-xs outline-none rounded"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={finishEditing}
              onKeyDown={(e) => {
                if (e.key === 'Enter') finishEditing();
                if (e.key === 'Escape') setEditingNodeId(null);
              }}
            />
          </div>
        );
      })()}

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 rounded bg-white/80 px-2 py-1 text-xs text-gray-500 border shadow-sm">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
