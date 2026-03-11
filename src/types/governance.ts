export type GovernanceStatus = 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type TriggerType = 'MANUAL' | 'ON_PUBLISH' | 'ON_CHANGE';

export interface WorkflowStep {
  name: string;
  description: string;
  type: 'approval' | 'review' | 'notification' | 'task';
  assigneeType: 'user' | 'role';
  assigneeId: string;
  timeoutDays?: number;
  requiredApprovals?: number;
}

export interface GovernanceWorkflowData {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  steps: WorkflowStep[];
  triggerType: TriggerType;
  createdBy: { firstName: string; lastName: string };
  createdAt: string;
  _count?: { instances: number };
}

export interface GovernanceInstanceData {
  id: string;
  workflow: { id: string; name: string; steps: WorkflowStep[] };
  process: { id: string; name: string };
  status: GovernanceStatus;
  currentStep: number;
  initiatedBy: { firstName: string; lastName: string };
  initiatedAt: string;
  completedAt?: string;
  approvals: ApprovalData[];
}

export interface ApprovalData {
  id: string;
  stepIndex: number;
  approver: { id: string; firstName: string; lastName: string };
  status: ApprovalStatus;
  comment?: string;
  decidedAt?: string;
}
