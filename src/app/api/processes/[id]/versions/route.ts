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

    const process = await prisma.process.findUnique({ where: { id } });
    if (!process) {
      return NextResponse.json(
        { error: 'Process not found' },
        { status: 404 }
      );
    }

    const versions = await prisma.processVersion.findMany({
      where: { processId: id },
      orderBy: { version: 'desc' },
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

    return NextResponse.json(versions);
  } catch (error) {
    console.error('Error listing versions:', error);
    return NextResponse.json(
      { error: 'Failed to list versions' },
      { status: 500 }
    );
  }
}

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

    const process = await prisma.process.findUnique({
      where: { id },
      include: {
        collaborators: true,
      },
    });

    if (!process) {
      return NextResponse.json(
        { error: 'Process not found' },
        { status: 404 }
      );
    }

    // Check if user is creator or editor
    const isCreator = process.createdById === session.user.id;
    const isEditor = process.collaborators.some(
      (c) => c.userId === session.user.id && (c.role === 'EDITOR' || c.role === 'OWNER')
    );

    if (!isCreator && !isEditor && !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to create versions for this process' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { bpmnXml, changelog } = body;

    if (!bpmnXml) {
      return NextResponse.json(
        { error: 'bpmnXml is required' },
        { status: 400 }
      );
    }

    const newVersionNumber = process.currentVersion + 1;

    const [version] = await prisma.$transaction([
      prisma.processVersion.create({
        data: {
          processId: id,
          version: newVersionNumber,
          bpmnXml,
          changelog: changelog || null,
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
      }),
      prisma.process.update({
        where: { id },
        data: {
          currentVersion: newVersionNumber,
          bpmnXml,
        },
      }),
    ]);

    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE',
      resource: 'process_version',
      resourceId: version.id,
      details: { processId: id, version: newVersionNumber, changelog },
    });

    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    console.error('Error creating version:', error);
    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    );
  }
}
