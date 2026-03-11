import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function POST(
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
        workflow: true,
        process: true,
        approvals: {
          orderBy: { stepIndex: 'asc' },
        },
      },
    });

    if (!instance) {
      return NextResponse.json(
        { error: 'Governance instance not found' },
        { status: 404 }
      );
    }

    if (instance.status !== 'PENDING' && instance.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'This governance instance is no longer active' },
        { status: 400 }
      );
    }

    // Find the user's pending approval for the current step
    const approval = instance.approvals.find(
      (a) => a.approverId === session.user.id && a.stepIndex === instance.currentStep && a.status === 'PENDING'
    );

    if (!approval) {
      return NextResponse.json(
        { error: 'You do not have a pending approval for the current step' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, comment } = body;

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be APPROVED or REJECTED' },
        { status: 400 }
      );
    }

    // Update the approval
    await prisma.governanceApproval.update({
      where: { id: approval.id },
      data: {
        status,
        comment: comment || null,
        decidedAt: new Date(),
      },
    });

    if (status === 'REJECTED') {
      // If rejected, set instance to REJECTED
      await prisma.governanceInstance.update({
        where: { id },
        data: {
          status: 'REJECTED',
          completedAt: new Date(),
        },
      });

      // Notify initiator
      await prisma.notification.create({
        data: {
          userId: instance.initiatedById,
          type: 'APPROVAL_REJECTED',
          title: 'Governance request rejected',
          message: `${session.user.firstName} ${session.user.lastName} rejected the governance request for "${instance.process.name}"`,
          link: `/governance/instances/${id}`,
        },
      });

      await createAuditLog({
        userId: session.user.id,
        action: 'REJECT',
        resource: 'governance_instance',
        resourceId: id,
        details: { stepIndex: instance.currentStep, comment },
      });
    } else {
      // Check if all approvals for current step are approved
      const currentStepApprovals = instance.approvals.filter(
        (a) => a.stepIndex === instance.currentStep
      );
      const remainingPending = currentStepApprovals.filter(
        (a) => a.id !== approval.id && a.status === 'PENDING'
      );

      if (remainingPending.length === 0) {
        // All approvals for current step are done, advance to next step
        let steps: Array<{ approverIds?: string[]; approverId?: string }> = [];
        if (instance.workflow.steps) {
          try {
            steps = JSON.parse(instance.workflow.steps);
          } catch {
            steps = [];
          }
        }

        const nextStep = instance.currentStep + 1;

        if (nextStep >= steps.length) {
          // All steps completed - mark as APPROVED
          await prisma.governanceInstance.update({
            where: { id },
            data: {
              status: 'APPROVED',
              currentStep: nextStep,
              completedAt: new Date(),
            },
          });

          // Notify initiator
          await prisma.notification.create({
            data: {
              userId: instance.initiatedById,
              type: 'APPROVAL_COMPLETED',
              title: 'Governance request approved',
              message: `The governance request for "${instance.process.name}" has been fully approved`,
              link: `/governance/instances/${id}`,
            },
          });
        } else {
          // Advance to next step
          await prisma.governanceInstance.update({
            where: { id },
            data: {
              status: 'IN_PROGRESS',
              currentStep: nextStep,
            },
          });

          // Create approvals for next step
          if (steps[nextStep]) {
            const nextStepDef = steps[nextStep];
            const approverIds = nextStepDef.approverIds || (nextStepDef.approverId ? [nextStepDef.approverId] : []);

            for (const approverId of approverIds) {
              await prisma.governanceApproval.create({
                data: {
                  instanceId: id,
                  stepIndex: nextStep,
                  approverId,
                  status: 'PENDING',
                },
              });

              // Notify next approver
              await prisma.notification.create({
                data: {
                  userId: approverId,
                  type: 'APPROVAL_REQUEST',
                  title: 'Approval requested',
                  message: `Your approval is needed for process "${instance.process.name}"`,
                  link: `/governance/instances/${id}`,
                },
              });
            }
          }
        }
      }

      await createAuditLog({
        userId: session.user.id,
        action: 'APPROVE',
        resource: 'governance_instance',
        resourceId: id,
        details: { stepIndex: instance.currentStep, comment },
      });
    }

    // Fetch and return updated instance
    const updatedInstance = await prisma.governanceInstance.findUnique({
      where: { id },
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
          orderBy: [{ stepIndex: 'asc' }, { createdAt: 'asc' }],
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

    return NextResponse.json(updatedInstance);
  } catch (error) {
    console.error('Error processing approval:', error);
    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    );
  }
}
