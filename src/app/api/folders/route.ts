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
    const parentId = searchParams.get('parentId');

    const where: Record<string, unknown> = {};

    if (parentId) {
      where.parentId = parentId;
    } else {
      where.parentId = null;
    }

    const folders = await prisma.folder.findMany({
      where,
      orderBy: { name: 'asc' },
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
            processes: true,
            children: true,
          },
        },
      },
    });

    return NextResponse.json(folders);
  } catch (error) {
    console.error('Error listing folders:', error);
    return NextResponse.json(
      { error: 'Failed to list folders' },
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

    await requirePermission(session.user.id, 'folders', 'create');

    const body = await request.json();
    const { name, description, parentId } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (parentId) {
      const parentFolder = await prisma.folder.findUnique({
        where: { id: parentId },
      });
      if (!parentFolder) {
        return NextResponse.json(
          { error: 'Parent folder not found' },
          { status: 404 }
        );
      }
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        description: description || null,
        parentId: parentId || null,
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
        _count: {
          select: {
            processes: true,
            children: true,
          },
        },
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE',
      resource: 'folder',
      resourceId: folder.id,
      details: { name, parentId },
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith('Permission denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error creating folder:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}
