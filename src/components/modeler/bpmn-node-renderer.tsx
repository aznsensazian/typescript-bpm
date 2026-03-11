'use client';

import React from 'react';
import { BpmnNode } from '@/store/modeler-store';

interface BpmnNodeRendererProps {
  node: BpmnNode;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  isConnecting: boolean;
  onConnectionStart: (nodeId: string) => void;
  onConnectionEnd: (nodeId: string) => void;
}

function getTaskIcon(type: string, x: number, y: number): React.ReactNode {
  const ix = x + 4;
  const iy = y + 4;
  const size = 14;

  switch (type) {
    case 'userTask':
      return (
        <g>
          <circle cx={ix + size / 2} cy={iy + 4} r={3} fill="none" stroke="#555" strokeWidth={1} />
          <path d={`M${ix + 2} ${iy + size - 2} Q${ix + size / 2} ${iy + 8} ${ix + size - 2} ${iy + size - 2}`} fill="none" stroke="#555" strokeWidth={1} />
        </g>
      );
    case 'serviceTask':
      return (
        <g>
          <circle cx={ix + size / 2} cy={iy + size / 2} r={4} fill="none" stroke="#555" strokeWidth={1} />
          <circle cx={ix + size / 2} cy={iy + size / 2} r={2} fill="#555" />
          {[0, 60, 120, 180, 240, 300].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const cx = ix + size / 2 + Math.cos(rad) * 5;
            const cy = iy + size / 2 + Math.sin(rad) * 5;
            return <circle key={angle} cx={cx} cy={cy} r={1} fill="#555" />;
          })}
        </g>
      );
    case 'scriptTask':
      return (
        <g>
          <path
            d={`M${ix + 2} ${iy + 2} L${ix + size - 4} ${iy + 2} L${ix + size - 2} ${iy + 4} L${ix + size - 2} ${iy + size - 2} L${ix + 4} ${iy + size - 2} L${ix + 2} ${iy + size - 4} Z`}
            fill="none"
            stroke="#555"
            strokeWidth={1}
          />
          <line x1={ix + 4} y1={iy + 5} x2={ix + size - 4} y2={iy + 5} stroke="#555" strokeWidth={0.8} />
          <line x1={ix + 4} y1={iy + 7.5} x2={ix + size - 4} y2={iy + 7.5} stroke="#555" strokeWidth={0.8} />
          <line x1={ix + 4} y1={iy + 10} x2={ix + size - 4} y2={iy + 10} stroke="#555" strokeWidth={0.8} />
        </g>
      );
    case 'sendTask':
      return (
        <g>
          <rect x={ix + 1} y={iy + 3} width={size - 2} height={size - 6} fill="none" stroke="#555" strokeWidth={1} rx={1} />
          <polyline
            points={`${ix + 1},${iy + 3} ${ix + size / 2},${iy + size / 2} ${ix + size - 1},${iy + 3}`}
            fill="none"
            stroke="#555"
            strokeWidth={1}
          />
        </g>
      );
    case 'receiveTask':
      return (
        <g>
          <rect x={ix + 1} y={iy + 3} width={size - 2} height={size - 6} fill="none" stroke="#555" strokeWidth={1.2} rx={1} />
          <polyline
            points={`${ix + 1},${iy + 3} ${ix + size / 2},${iy + size / 2} ${ix + size - 1},${iy + 3}`}
            fill="none"
            stroke="#555"
            strokeWidth={1.2}
          />
        </g>
      );
    case 'manualTask':
      return (
        <g>
          <path
            d={`M${ix + 2} ${iy + size / 2} C${ix + 4} ${iy + 2} ${ix + size - 4} ${iy + 2} ${ix + size - 2} ${iy + size / 2} C${ix + size - 4} ${iy + size - 2} ${ix + 4} ${iy + size - 2} ${ix + 2} ${iy + size / 2}`}
            fill="none"
            stroke="#555"
            strokeWidth={1}
          />
        </g>
      );
    case 'businessRuleTask':
      return (
        <g>
          <rect x={ix + 1} y={iy + 2} width={size - 2} height={size - 4} fill="none" stroke="#555" strokeWidth={1} />
          <line x1={ix + 1} y1={iy + 5} x2={ix + size - 1} y2={iy + 5} stroke="#555" strokeWidth={1} />
          <line x1={ix + 1} y1={iy + 8} x2={ix + size - 1} y2={iy + 8} stroke="#555" strokeWidth={1} />
          <line x1={ix + size / 2} y1={iy + 5} x2={ix + size / 2} y2={iy + size - 2} stroke="#555" strokeWidth={1} />
        </g>
      );
    default:
      return null;
  }
}

export default function BpmnNodeRenderer({
  node,
  isSelected,
  onMouseDown,
  onDoubleClick,
  isConnecting,
  onConnectionStart,
  onConnectionEnd,
}: BpmnNodeRendererProps) {
  const { id, type, name, x, y, width, height, properties } = node;
  const selectionStroke = isSelected ? '#2563eb' : 'transparent';
  const selectionWidth = isSelected ? 2 : 0;

  const handleConnectorMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConnectionStart(id);
  };

  const handleMouseUp = () => {
    if (isConnecting) {
      onConnectionEnd(id);
    }
  };

  const elementColor = (properties?.color as string) || undefined;

  const renderConnectorPoints = () => {
    const points = [
      { cx: x + width / 2, cy: y, pos: 'top' },
      { cx: x + width, cy: y + height / 2, pos: 'right' },
      { cx: x + width / 2, cy: y + height, pos: 'bottom' },
      { cx: x, cy: y + height / 2, pos: 'left' },
    ];

    return (
      <g className="connector-points" style={{ opacity: isSelected ? 1 : 0 }}>
        {points.map((p) => (
          <circle
            key={p.pos}
            cx={p.cx}
            cy={p.cy}
            r={4}
            fill="white"
            stroke="#2563eb"
            strokeWidth={1.5}
            style={{ cursor: 'crosshair' }}
            onMouseDown={handleConnectorMouseDown}
          />
        ))}
      </g>
    );
  };

  const renderShape = () => {
    switch (type) {
      // ---- Events ----
      case 'startEvent': {
        const cx = x + width / 2;
        const cy = y + height / 2;
        const r = Math.min(width, height) / 2 - 2;
        return (
          <g onMouseDown={onMouseDown} onDoubleClick={onDoubleClick} onMouseUp={handleMouseUp}>
            <circle cx={cx} cy={cy} r={r + 4} fill="transparent" stroke={selectionStroke} strokeWidth={selectionWidth} />
            <circle cx={cx} cy={cy} r={r} fill={elementColor || '#d4edda'} stroke="#28a745" strokeWidth={2} style={{ cursor: 'move' }} />
            <text x={cx} y={y + height + 14} textAnchor="middle" fontSize={11} fill="#333" style={{ pointerEvents: 'none' }}>
              {name}
            </text>
            {renderConnectorPoints()}
          </g>
        );
      }

      case 'endEvent': {
        const cx = x + width / 2;
        const cy = y + height / 2;
        const r = Math.min(width, height) / 2 - 2;
        return (
          <g onMouseDown={onMouseDown} onDoubleClick={onDoubleClick} onMouseUp={handleMouseUp}>
            <circle cx={cx} cy={cy} r={r + 4} fill="transparent" stroke={selectionStroke} strokeWidth={selectionWidth} />
            <circle cx={cx} cy={cy} r={r} fill={elementColor || '#f8d7da'} stroke="#dc3545" strokeWidth={4} style={{ cursor: 'move' }} />
            <text x={cx} y={y + height + 14} textAnchor="middle" fontSize={11} fill="#333" style={{ pointerEvents: 'none' }}>
              {name}
            </text>
            {renderConnectorPoints()}
          </g>
        );
      }

      case 'intermediateEvent': {
        const cx = x + width / 2;
        const cy = y + height / 2;
        const r = Math.min(width, height) / 2 - 2;
        return (
          <g onMouseDown={onMouseDown} onDoubleClick={onDoubleClick} onMouseUp={handleMouseUp}>
            <circle cx={cx} cy={cy} r={r + 4} fill="transparent" stroke={selectionStroke} strokeWidth={selectionWidth} />
            <circle cx={cx} cy={cy} r={r} fill={elementColor || '#fff3cd'} stroke="#ffc107" strokeWidth={2} style={{ cursor: 'move' }} />
            <circle cx={cx} cy={cy} r={r - 3} fill="none" stroke="#ffc107" strokeWidth={1.5} />
            <text x={cx} y={y + height + 14} textAnchor="middle" fontSize={11} fill="#333" style={{ pointerEvents: 'none' }}>
              {name}
            </text>
            {renderConnectorPoints()}
          </g>
        );
      }

      // ---- Tasks ----
      case 'task':
      case 'userTask':
      case 'serviceTask':
      case 'scriptTask':
      case 'sendTask':
      case 'receiveTask':
      case 'manualTask':
      case 'businessRuleTask': {
        return (
          <g onMouseDown={onMouseDown} onDoubleClick={onDoubleClick} onMouseUp={handleMouseUp}>
            {isSelected && (
              <rect x={x - 3} y={y - 3} width={width + 6} height={height + 6} rx={10} ry={10} fill="none" stroke={selectionStroke} strokeWidth={selectionWidth} />
            )}
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              rx={8}
              ry={8}
              fill={elementColor || 'white'}
              stroke="#333"
              strokeWidth={1.5}
              style={{ cursor: 'move' }}
            />
            {type !== 'task' && getTaskIcon(type, x, y)}
            <text x={x + width / 2} y={y + height / 2 + 4} textAnchor="middle" fontSize={12} fill="#333" style={{ pointerEvents: 'none' }}>
              {name.length > 18 ? name.substring(0, 16) + '...' : name}
            </text>
            {renderConnectorPoints()}
          </g>
        );
      }

      // ---- Gateways ----
      case 'exclusiveGateway':
      case 'parallelGateway':
      case 'inclusiveGateway':
      case 'eventBasedGateway':
      case 'complexGateway': {
        const cx = x + width / 2;
        const cy = y + height / 2;
        const half = Math.min(width, height) / 2 - 2;
        const diamondPoints = `${cx},${cy - half} ${cx + half},${cy} ${cx},${cy + half} ${cx - half},${cy}`;

        let gatewaySymbol: React.ReactNode = null;
        if (type === 'exclusiveGateway') {
          gatewaySymbol = (
            <g>
              <line x1={cx - 6} y1={cy - 6} x2={cx + 6} y2={cy + 6} stroke="#333" strokeWidth={2.5} />
              <line x1={cx + 6} y1={cy - 6} x2={cx - 6} y2={cy + 6} stroke="#333" strokeWidth={2.5} />
            </g>
          );
        } else if (type === 'parallelGateway') {
          gatewaySymbol = (
            <g>
              <line x1={cx} y1={cy - 7} x2={cx} y2={cy + 7} stroke="#333" strokeWidth={2.5} />
              <line x1={cx - 7} y1={cy} x2={cx + 7} y2={cy} stroke="#333" strokeWidth={2.5} />
            </g>
          );
        } else if (type === 'inclusiveGateway') {
          gatewaySymbol = <circle cx={cx} cy={cy} r={7} fill="none" stroke="#333" strokeWidth={2.5} />;
        } else if (type === 'eventBasedGateway') {
          gatewaySymbol = (
            <g>
              <circle cx={cx} cy={cy} r={8} fill="none" stroke="#333" strokeWidth={1.5} />
              <circle cx={cx} cy={cy} r={5} fill="none" stroke="#333" strokeWidth={1.5} />
            </g>
          );
        } else if (type === 'complexGateway') {
          gatewaySymbol = (
            <g>
              <line x1={cx} y1={cy - 7} x2={cx} y2={cy + 7} stroke="#333" strokeWidth={2} />
              <line x1={cx - 7} y1={cy} x2={cx + 7} y2={cy} stroke="#333" strokeWidth={2} />
              <line x1={cx - 5} y1={cy - 5} x2={cx + 5} y2={cy + 5} stroke="#333" strokeWidth={2} />
              <line x1={cx + 5} y1={cy - 5} x2={cx - 5} y2={cy + 5} stroke="#333" strokeWidth={2} />
            </g>
          );
        }

        return (
          <g onMouseDown={onMouseDown} onDoubleClick={onDoubleClick} onMouseUp={handleMouseUp}>
            {isSelected && (
              <polygon points={`${cx},${cy - half - 3} ${cx + half + 3},${cy} ${cx},${cy + half + 3} ${cx - half - 3},${cy}`} fill="none" stroke={selectionStroke} strokeWidth={selectionWidth} />
            )}
            <polygon points={diamondPoints} fill={elementColor || '#fff8e1'} stroke="#333" strokeWidth={2} style={{ cursor: 'move' }} />
            {gatewaySymbol}
            <text x={cx} y={y + height + 14} textAnchor="middle" fontSize={11} fill="#333" style={{ pointerEvents: 'none' }}>
              {name}
            </text>
            {renderConnectorPoints()}
          </g>
        );
      }

      // ---- Sub-Process ----
      case 'subProcess':
      case 'callActivity': {
        const borderStyle = type === 'callActivity' ? 3 : 1.5;
        return (
          <g onMouseDown={onMouseDown} onDoubleClick={onDoubleClick} onMouseUp={handleMouseUp}>
            {isSelected && (
              <rect x={x - 3} y={y - 3} width={width + 6} height={height + 6} rx={10} ry={10} fill="none" stroke={selectionStroke} strokeWidth={selectionWidth} />
            )}
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              rx={8}
              ry={8}
              fill={elementColor || 'white'}
              stroke="#333"
              strokeWidth={borderStyle}
              style={{ cursor: 'move' }}
            />
            {/* Expand icon at bottom center */}
            <rect x={x + width / 2 - 7} y={y + height - 16} width={14} height={14} rx={2} fill="none" stroke="#555" strokeWidth={1} />
            <line x1={x + width / 2} y1={y + height - 13} x2={x + width / 2} y2={y + height - 5} stroke="#555" strokeWidth={1.2} />
            <line x1={x + width / 2 - 4} y1={y + height - 9} x2={x + width / 2 + 4} y2={y + height - 9} stroke="#555" strokeWidth={1.2} />
            <text x={x + width / 2} y={y + height / 2 - 4} textAnchor="middle" fontSize={12} fill="#333" style={{ pointerEvents: 'none' }}>
              {name}
            </text>
            {renderConnectorPoints()}
          </g>
        );
      }

      // ---- Pool ----
      case 'pool': {
        return (
          <g onMouseDown={onMouseDown} onDoubleClick={onDoubleClick} onMouseUp={handleMouseUp}>
            {isSelected && (
              <rect x={x - 3} y={y - 3} width={width + 6} height={height + 6} fill="none" stroke={selectionStroke} strokeWidth={selectionWidth} />
            )}
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              fill={elementColor || '#f0f4f8'}
              stroke="#333"
              strokeWidth={2}
              style={{ cursor: 'move' }}
            />
            {/* Label band on left */}
            <rect x={x} y={y} width={30} height={height} fill="#dde4ed" stroke="#333" strokeWidth={1} />
            <text
              x={x + 15}
              y={y + height / 2}
              textAnchor="middle"
              fontSize={12}
              fontWeight="bold"
              fill="#333"
              transform={`rotate(-90, ${x + 15}, ${y + height / 2})`}
              style={{ pointerEvents: 'none' }}
            >
              {name}
            </text>
            {renderConnectorPoints()}
          </g>
        );
      }

      // ---- Lane ----
      case 'lane': {
        return (
          <g onMouseDown={onMouseDown} onDoubleClick={onDoubleClick} onMouseUp={handleMouseUp}>
            {isSelected && (
              <rect x={x - 3} y={y - 3} width={width + 6} height={height + 6} fill="none" stroke={selectionStroke} strokeWidth={selectionWidth} />
            )}
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              fill={elementColor || '#fafbfc'}
              stroke="#999"
              strokeWidth={1}
              style={{ cursor: 'move' }}
            />
            <rect x={x} y={y} width={25} height={height} fill="#e8ecf0" stroke="#999" strokeWidth={0.5} />
            <text
              x={x + 12}
              y={y + height / 2}
              textAnchor="middle"
              fontSize={11}
              fill="#333"
              transform={`rotate(-90, ${x + 12}, ${y + height / 2})`}
              style={{ pointerEvents: 'none' }}
            >
              {name}
            </text>
            {renderConnectorPoints()}
          </g>
        );
      }

      // ---- Data Object ----
      case 'dataObject': {
        const fold = 10;
        const pathData = `M${x} ${y} L${x + width - fold} ${y} L${x + width} ${y + fold} L${x + width} ${y + height} L${x} ${y + height} Z`;
        const foldPath = `M${x + width - fold} ${y} L${x + width - fold} ${y + fold} L${x + width} ${y + fold}`;
        return (
          <g onMouseDown={onMouseDown} onDoubleClick={onDoubleClick} onMouseUp={handleMouseUp}>
            {isSelected && (
              <rect x={x - 3} y={y - 3} width={width + 6} height={height + 6} fill="none" stroke={selectionStroke} strokeWidth={selectionWidth} />
            )}
            <path d={pathData} fill={elementColor || 'white'} stroke="#333" strokeWidth={1.5} style={{ cursor: 'move' }} />
            <path d={foldPath} fill="none" stroke="#333" strokeWidth={1} />
            <text x={x + width / 2} y={y + height + 14} textAnchor="middle" fontSize={11} fill="#333" style={{ pointerEvents: 'none' }}>
              {name}
            </text>
            {renderConnectorPoints()}
          </g>
        );
      }

      // ---- Data Store ----
      case 'dataStore': {
        const cx = x + width / 2;
        const ry = 6;
        return (
          <g onMouseDown={onMouseDown} onDoubleClick={onDoubleClick} onMouseUp={handleMouseUp}>
            {isSelected && (
              <rect x={x - 3} y={y - 3} width={width + 6} height={height + 6} fill="none" stroke={selectionStroke} strokeWidth={selectionWidth} />
            )}
            {/* Cylinder body */}
            <path
              d={`M${x} ${y + ry} L${x} ${y + height - ry} Q${x} ${y + height + ry - 2} ${cx} ${y + height + ry - 2} Q${x + width} ${y + height + ry - 2} ${x + width} ${y + height - ry} L${x + width} ${y + ry}`}
              fill={elementColor || 'white'}
              stroke="#333"
              strokeWidth={1.5}
              style={{ cursor: 'move' }}
            />
            {/* Top ellipse */}
            <ellipse cx={cx} cy={y + ry} rx={width / 2} ry={ry} fill={elementColor || '#f0f0f0'} stroke="#333" strokeWidth={1.5} />
            <text x={cx} y={y + height + 16} textAnchor="middle" fontSize={11} fill="#333" style={{ pointerEvents: 'none' }}>
              {name}
            </text>
            {renderConnectorPoints()}
          </g>
        );
      }

      // ---- Text Annotation ----
      case 'textAnnotation': {
        return (
          <g onMouseDown={onMouseDown} onDoubleClick={onDoubleClick} onMouseUp={handleMouseUp}>
            {isSelected && (
              <rect x={x - 3} y={y - 3} width={width + 6} height={height + 6} fill="none" stroke={selectionStroke} strokeWidth={selectionWidth} />
            )}
            <path
              d={`M${x + 10} ${y} L${x} ${y} L${x} ${y + height} L${x + 10} ${y + height}`}
              fill="none"
              stroke="#333"
              strokeWidth={1.5}
            />
            <rect x={x} y={y} width={width} height={height} fill="transparent" style={{ cursor: 'move' }} />
            <foreignObject x={x + 4} y={y + 2} width={width - 8} height={height - 4}>
              <div
                style={{
                  fontSize: 11,
                  color: '#333',
                  overflow: 'hidden',
                  wordWrap: 'break-word',
                }}
              >
                {name}
              </div>
            </foreignObject>
            {renderConnectorPoints()}
          </g>
        );
      }

      // ---- Group ----
      case 'group': {
        return (
          <g onMouseDown={onMouseDown} onDoubleClick={onDoubleClick} onMouseUp={handleMouseUp}>
            {isSelected && (
              <rect x={x - 3} y={y - 3} width={width + 6} height={height + 6} rx={10} fill="none" stroke={selectionStroke} strokeWidth={selectionWidth} />
            )}
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              rx={8}
              ry={8}
              fill="transparent"
              stroke="#999"
              strokeWidth={1.5}
              strokeDasharray="8 4"
              style={{ cursor: 'move' }}
            />
            <text x={x + width / 2} y={y - 4} textAnchor="middle" fontSize={11} fill="#666" style={{ pointerEvents: 'none' }}>
              {name}
            </text>
            {renderConnectorPoints()}
          </g>
        );
      }

      default: {
        return (
          <g onMouseDown={onMouseDown} onDoubleClick={onDoubleClick} onMouseUp={handleMouseUp}>
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              rx={4}
              fill={elementColor || '#eee'}
              stroke={isSelected ? '#2563eb' : '#999'}
              strokeWidth={isSelected ? 2 : 1}
              style={{ cursor: 'move' }}
            />
            <text x={x + width / 2} y={y + height / 2 + 4} textAnchor="middle" fontSize={11} fill="#333" style={{ pointerEvents: 'none' }}>
              {name}
            </text>
            {renderConnectorPoints()}
          </g>
        );
      }
    }
  };

  return renderShape();
}
