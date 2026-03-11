import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { requirePermission } from '@/lib/permissions';

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

    const process = await prisma.process.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 5,
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
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: 'desc' },
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
            replies: {
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
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        collaborators: {
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
        },
      },
    });

    if (!process) {
      return NextResponse.json(
        { error: 'Process not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(process);
  } catch (error) {
    console.error('Error fetching process:', error);
    return NextResponse.json(
      { error: 'Failed to fetch process' },
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

    const existingProcess = await prisma.process.findUnique({
      where: { id },
      include: {
        collaborators: true,
      },
    });

    if (!existingProcess) {
      return NextResponse.json(
        { error: 'Process not found' },
        { status: 404 }
      );
    }

    // Check if user is creator or an EDITOR collaborator
    const isCreator = existingProcess.createdById === session.user.id;
    const isEditor = existingProcess.collaborators.some(
      (c) => c.userId === session.user.id && (c.role === 'EDITOR' || c.role === 'OWNER')
    );

    if (!isCreator && !isEditor && !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this process' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, category, bpmnXml, status, folderId, tags, svgThumbnail } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (bpmnXml !== undefined) updateData.bpmnXml = bpmnXml;
    if (status !== undefined) updateData.status = status;
    if (folderId !== undefined) updateData.folderId = folderId;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? JSON.stringify(tags) : tags;
    if (svgThumbnail !== undefined) updateData.svgThumbnail = svgThumbnail;

    const updated = await prisma.process.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
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

    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE',
      resource: 'process',
      resourceId: id,
      details: { updatedFields: Object.keys(updateData) },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating process:', error);
    return NextResponse.json(
      { error: 'Failed to update process' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existingProcess = await prisma.process.findUnique({
      where: { id },
    });

    if (!existingProcess) {
      return NextResponse.json(
        { error: 'Process not found' },
        { status: 404 }
      );
    }

    // Only creator or admin can delete
    if (existingProcess.createdById !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Only the process creator or an admin can delete this process' },
        { status: 403 }
      );
    }

    // Cascade delete is handled by Prisma schema (onDelete: Cascade)
    await prisma.process.delete({ where: { id } });

    await createAuditLog({
      userId: session.user.id,
      action: 'DELETE',
      resource: 'process',
      resourceId: id,
      details: { name: existingProcess.name },
    });

    return NextResponse.json({ message: 'Process deleted successfully' });
  } catch (error) {
    console.error('Error deleting process:', error);
    return NextResponse.json(
      { error: 'Failed to delete process' },
      { status: 500 }
    );
  }
}
