export type ProcessStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'UNDER_REVIEW';
export type CollaboratorRole = 'VIEWER' | 'EDITOR' | 'REVIEWER' | 'OWNER';

export interface BpmnElement {
  id: string;
  type: BpmnElementType;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  properties: Record<string, unknown>;
  connections: Connection[];
}

export type BpmnElementType =
  | 'startEvent' | 'endEvent' | 'intermediateEvent'
  | 'task' | 'userTask' | 'serviceTask' | 'scriptTask' | 'sendTask' | 'receiveTask' | 'manualTask' | 'businessRuleTask'
  | 'subProcess' | 'callActivity'
  | 'exclusiveGateway' | 'parallelGateway' | 'inclusiveGateway' | 'eventBasedGateway' | 'complexGateway'
  | 'pool' | 'lane'
  | 'dataObject' | 'dataStore' | 'message'
  | 'textAnnotation' | 'group';

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'sequenceFlow' | 'messageFlow' | 'association';
  label?: string;
  waypoints: { x: number; y: number }[];
  condition?: string;
}

export interface ProcessData {
  id: string;
  name: string;
  description: string;
  category: string;
  status: ProcessStatus;
  bpmnXml: string;
  currentVersion: number;
  folderId?: string;
  createdBy: { id: string; firstName: string; lastName: string; avatar?: string };
  tags: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  _count?: { comments: number; collaborators: number; versions: number };
}

export interface ProcessVersion {
  id: string;
  version: number;
  changelog: string;
  createdBy: { firstName: string; lastName: string };
  createdAt: string;
}

export interface FolderData {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  children?: FolderData[];
  _count?: { processes: number; children: number };
}
