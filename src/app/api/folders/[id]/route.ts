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

    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        children: {
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: {
                processes: true,
                children: true,
              },
            },
          },
        },
        processes: {
          orderBy: { updatedAt: 'desc' },
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
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(folder);
  } catch (error) {
    console.error('Error fetching folder:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folder' },
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

    const existingFolder = await prisma.folder.findUnique({ where: { id } });
    if (!existingFolder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    if (existingFolder.createdById !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to update this folder' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const updated = await prisma.folder.update({
      where: { id },
      data: updateData,
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
      action: 'UPDATE',
      resource: 'folder',
      resourceId: id,
      details: { updatedFields: Object.keys(updateData) },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating folder:', error);
    return NextResponse.json(
      { error: 'Failed to update folder' },
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

    const existingFolder = await prisma.folder.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            processes: true,
            children: true,
          },
        },
      },
    });

    if (!existingFolder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      );
    }

    if (existingFolder.createdById !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this folder' },
        { status: 403 }
      );
    }

    // Check if folder has contents
    if (existingFolder._count.processes > 0 || existingFolder._count.children > 0) {
      // Move child processes and folders to parent (cascade up) or set to null
      await prisma.$transaction([
        prisma.process.updateMany({
          where: { folderId: id },
          data: { folderId: existingFolder.parentId },
        }),
        prisma.folder.updateMany({
          where: { parentId: id },
          data: { parentId: existingFolder.parentId },
        }),
      ]);
    }

    await prisma.folder.delete({ where: { id } });

    await createAuditLog({
      userId: session.user.id,
      action: 'DELETE',
      resource: 'folder',
      resourceId: id,
      details: { name: existingFolder.name },
    });

    return NextResponse.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    );
  }
}
