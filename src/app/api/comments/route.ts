import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { processId, content, parentId } = body;

    if (!processId || !content) {
      return NextResponse.json(
        { error: 'processId and content are required' },
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

    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });
      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        processId,
        userId: session.user.id,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Create notification for process owner (if commenter is not the owner)
    if (process.createdById !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: process.createdById,
          type: 'COMMENT',
          title: 'New comment on your process',
          message: `${session.user.firstName} ${session.user.lastName} commented on "${process.name}"`,
          link: `/processes/${processId}`,
        },
      });
    }

    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE',
      resource: 'comment',
      resourceId: comment.id,
      details: { processId, parentId },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
