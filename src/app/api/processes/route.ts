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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';
    const folderId = searchParams.get('folderId') || '';

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (folderId) {
      where.folderId = folderId;
    }

    const [processes, total] = await Promise.all([
      prisma.process.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
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
          _count: {
            select: {
              comments: true,
              versions: true,
              collaborators: true,
            },
          },
        },
      }),
      prisma.process.count({ where }),
    ]);

    return NextResponse.json({
      data: processes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error listing processes:', error);
    return NextResponse.json(
      { error: 'Failed to list processes' },
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

    await requirePermission(session.user.id, 'processes', 'create');

    const body = await request.json();
    const { name, description, category, bpmnXml, folderId, tags } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const process = await prisma.process.create({
      data: {
        name,
        description: description || null,
        category: category || null,
        bpmnXml: bpmnXml || null,
        folderId: folderId || null,
        tags: tags ? (Array.isArray(tags) ? JSON.stringify(tags) : tags) : null,
        status: 'DRAFT',
        currentVersion: 1,
        createdById: session.user.id,
      },
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

    // Create initial version
    if (bpmnXml) {
      await prisma.processVersion.create({
        data: {
          processId: process.id,
          version: 1,
          bpmnXml,
          changelog: 'Initial version',
          createdById: session.user.id,
        },
      });
    }

    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE',
      resource: 'process',
      resourceId: process.id,
      details: { name, category },
    });

    return NextResponse.json(process, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith('Permission denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error creating process:', error);
    return NextResponse.json(
      { error: 'Failed to create process' },
      { status: 500 }
    );
  }
}
