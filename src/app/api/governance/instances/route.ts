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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const processId = searchParams.get('processId') || '';

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (processId) {
      where.processId = processId;
    }

    const instances = await prisma.governanceInstance.findMany({
      where,
      orderBy: { initiatedAt: 'desc' },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            triggerType: true,
          },
        },
        process: {
          select: {
            id: true,
            name: true,
            category: true,
            status: true,
          },
        },
        initiatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approvals: {
          orderBy: { stepIndex: 'asc' },
          include: {
            approver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(instances);
  } catch (error) {
    console.error('Error listing governance instances:', error);
    return NextResponse.json(
      { error: 'Failed to list governance instances' },
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
    const { workflowId, processId } = body;

    if (!workflowId || !processId) {
      return NextResponse.json(
        { error: 'workflowId and processId are required' },
        { status: 400 }
      );
    }

    const workflow = await prisma.governanceWorkflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    if (workflow.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Workflow is not active' },
        { status: 400 }
      );
    }

    const process = await prisma.process.findUnique({
      where: { id: processId },
    });

    if (!process) {
      return NextResponse.json(
        { error: 'Process not found' },
        { status: 404 }
      );
    }

    // Parse workflow steps to create initial approvals
    let steps: Array<{ approverIds?: string[]; approverId?: string; name?: string }> = [];
    if (workflow.steps) {
      try {
        steps = JSON.parse(workflow.steps);
      } catch {
        steps = [];
      }
    }

    const instance = await prisma.governanceInstance.create({
      data: {
        workflowId,
        processId,
        status: 'PENDING',
        currentStep: 0,
        initiatedById: session.user.id,
      },
    });

    // Create initial pending approvals for step 0
    if (steps.length > 0 && steps[0]) {
      const step = steps[0];
      const approverIds = step.approverIds || (step.approverId ? [step.approverId] : []);

      for (const approverId of approverIds) {
        await prisma.governanceApproval.create({
          data: {
            instanceId: instance.id,
            stepIndex: 0,
            approverId,
            status: 'PENDING',
          },
        });

        // Notify approver
        await prisma.notification.create({
          data: {
            userId: approverId,
            type: 'APPROVAL_REQUEST',
            title: 'Approval requested',
            message: `${session.user.firstName} ${session.user.lastName} has requested your approval for process "${process.name}"`,
            link: `/governance/instances/${instance.id}`,
          },
        });
      }
    }

    // Update process status
    await prisma.process.update({
      where: { id: processId },
      data: { status: 'UNDER_REVIEW' },
    });

    const fullInstance = await prisma.governanceInstance.findUnique({
      where: { id: instance.id },
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
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE',
      resource: 'governance_instance',
      resourceId: instance.id,
      details: { workflowId, processId },
    });

    return NextResponse.json(fullInstance, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith('Permission denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error creating governance instance:', error);
    return NextResponse.json(
      { error: 'Failed to create governance instance' },
      { status: 500 }
    );
  }
}
