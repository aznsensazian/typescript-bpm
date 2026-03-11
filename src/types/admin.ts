export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  department?: string;
  jobTitle?: string;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: string;
  roles: { role: { id: string; name: string } }[];
}

export interface RoleData {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: { permission: { id: string; resource: string; action: string } }[];
  _count?: { users: number };
}

export interface PermissionData {
  id: string;
  resource: string;
  action: string;
  description: string;
}

export interface AuditLogData {
  id: string;
  user?: { firstName: string; lastName: string; email: string };
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}
