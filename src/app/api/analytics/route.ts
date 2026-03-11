import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
    const days = daysMap[period] || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [
      totalProcesses,
      publishedProcesses,
      draftProcesses,
      archivedProcesses,
      totalUsers,
      activeUsers,
      totalComments,
      totalPublications,
      recentAuditLogs,
      governanceInstances,
    ] = await Promise.all([
      prisma.process.count(),
      prisma.process.count({ where: { status: 'PUBLISHED' } }),
      prisma.process.count({ where: { status: 'DRAFT' } }),
      prisma.process.count({ where: { status: 'ARCHIVED' } }),
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.comment.count({ where: { createdAt: { gte: since } } }),
      prisma.publication.count(),
      prisma.auditLog.count({ where: { createdAt: { gte: since } } }),
      prisma.governanceInstance.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    const governanceByStatus = Object.fromEntries(
      governanceInstances.map((g) => [g.status, g._count.id])
    );

    return NextResponse.json({
      overview: {
        totalProcesses,
        publishedProcesses,
        draftProcesses,
        archivedProcesses,
        totalUsers,
        activeUsers,
      },
      activity: {
        period,
        comments: totalComments,
        publications: totalPublications,
        auditEvents: recentAuditLogs,
      },
      governance: governanceByStatus,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
