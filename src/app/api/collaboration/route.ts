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
    const search = searchParams.get('search') || '';
    const isPublic = searchParams.get('isPublic');

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (isPublic !== null && isPublic !== '') {
      where.isPublic = isPublic === 'true';
    }

    const publications = await prisma.publication.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      include: {
        process: {
          select: {
            id: true,
            name: true,
            category: true,
            status: true,
          },
        },
        publishedBy: {
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
            feedbacks: true,
          },
        },
      },
    });

    return NextResponse.json(publications);
  } catch (error) {
    console.error('Error listing publications:', error);
    return NextResponse.json(
      { error: 'Failed to list publications' },
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

    await requirePermission(session.user.id, 'publications', 'publish');

    const body = await request.json();
    const { processId, title, description, isPublic } = body;

    if (!processId || !title) {
      return NextResponse.json(
        { error: 'processId and title are required' },
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

    const [publication] = await prisma.$transaction([
      prisma.publication.create({
        data: {
          processId,
          title,
          description: description || null,
          isPublic: isPublic ?? false,
          publishedById: session.user.id,
        },
        include: {
          process: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          publishedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.process.update({
        where: { id: processId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      }),
    ]);

    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE',
      resource: 'publication',
      resourceId: publication.id,
      details: { processId, title, isPublic },
    });

    return NextResponse.json(publication, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith('Permission denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error creating publication:', error);
    return NextResponse.json(
      { error: 'Failed to create publication' },
      { status: 500 }
    );
  }
}
