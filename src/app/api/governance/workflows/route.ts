import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { requirePermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflows = await prisma.governanceWorkflow.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            instances: true,
          },
        },
      },
    });

    return NextResponse.json(workflows);
  } catch (error) {
    console.error('Error listing workflows:', error);
    return NextResponse.json(
      { error: 'Failed to list workflows' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(session.user.id, 'governance', 'create');

    const body = await request.json();
    const { name, description, steps, triggerType } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const workflow = await prisma.governanceWorkflow.create({
      data: {
        name,
        description: description || null,
        steps: steps ? (typeof steps === 'string' ? steps : JSON.stringify(steps)) : null,
        triggerType: triggerType || 'MANUAL',
        createdById: session.user.id,
      },
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
    });

    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE',
      resource: 'governance_workflow',
      resourceId: workflow.id,
      details: { name, triggerType },
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith('Permission denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}
