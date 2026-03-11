import prisma from './prisma';

export type Resource = 'processes' | 'folders' | 'users' | 'roles' | 'governance' | 'publications' | 'dictionary' | 'audit-logs' | 'settings';
export type Action = 'create' | 'read' | 'update' | 'delete' | 'publish' | 'approve' | 'manage';

export async function hasPermission(userId: string, resource: Resource, action: Action): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
  });
  if (!user) return false;
  if (user.isAdmin) return true;
  return user.roles.some(ur => ur.role.permissions.some(rp => rp.permission.resource === resource && (rp.permission.action === action || rp.permission.action === 'manage')));
}

export async function requirePermission(userId: string, resource: Resource, action: Action): Promise<void> {
  const allowed = await hasPermission(userId, resource, action);
  if (!allowed) throw new Error(`Permission denied: ${action} on ${resource}`);
}
