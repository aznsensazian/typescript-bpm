import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const instance = await prisma.governanceInstance.findUnique({
      where: { id },
      include: {
        workflow: {
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        process: {
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        initiatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        approvals: {
          orderBy: [{ stepIndex: 'asc' }, { createdAt: 'asc' }],
          include: {
            approver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!instance) {
      return NextResponse.json(
        { error: 'Governance instance not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(instance);
  } catch (error) {
    console.error('Error fetching governance instance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch governance instance' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existingInstance = await prisma.governanceInstance.findUnique({
      where: { id },
    });

    if (!existingInstance) {
      return NextResponse.json(
        { error: 'Governance instance not found' },
        { status: 404 }
      );
    }

    // Only initiator or admin can update (e.g., cancel)
    if (existingInstance.initiatedById !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to update this instance' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, data } = body;

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'CANCELLED' || status === 'APPROVED' || status === 'REJECTED') {
        updateData.completedAt = new Date();
      }
    }
    if (data !== undefined) {
      updateData.data = typeof data === 'string' ? data : JSON.stringify(data);
    }

    const updated = await prisma.governanceInstance.update({
      where: { id },
      data: updateData,
      include: {
        workflow: {
          select: { id: true, name: true },
        },
        process: {
          select: { id: true, name: true },
        },
        initiatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE',
      resource: 'governance_instance',
      resourceId: id,
      details: { status, updatedFields: Object.keys(updateData) },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating governance instance:', error);
    return NextResponse.json(
      { error: 'Failed to update governance instance' },
      { status: 500 }
    );
  }
}
