import prisma from './prisma';

export async function createAuditLog(params: {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}) {
  return prisma.auditLog.create({
    data: {
      ...params,
      details: params.details ? JSON.stringify(params.details) : undefined,
    },
  });
}
