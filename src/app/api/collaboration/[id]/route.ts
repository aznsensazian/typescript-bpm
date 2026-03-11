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

    const publication = await prisma.publication.findUnique({
      where: { id },
      include: {
        process: {
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
        feedbacks: {
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
          },
        },
      },
    });

    if (!publication) {
      return NextResponse.json(
        { error: 'Publication not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.publication.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json(publication);
  } catch (error) {
    console.error('Error fetching publication:', error);
    return NextResponse.json(
      { error: 'Failed to fetch publication' },
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

    const existingPublication = await prisma.publication.findUnique({
      where: { id },
    });

    if (!existingPublication) {
      return NextResponse.json(
        { error: 'Publication not found' },
        { status: 404 }
      );
    }

    if (existingPublication.publishedById !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to update this publication' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, isPublic, expiresAt } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const updated = await prisma.publication.update({
      where: { id },
      data: updateData,
      include: {
        process: {
          select: {
            id: true,
            name: true,
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
    });

    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE',
      resource: 'publication',
      resourceId: id,
      details: { updatedFields: Object.keys(updateData) },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating publication:', error);
    return NextResponse.json(
      { error: 'Failed to update publication' },
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

    const existingPublication = await prisma.publication.findUnique({
      where: { id },
      include: {
        process: true,
      },
    });

    if (!existingPublication) {
      return NextResponse.json(
        { error: 'Publication not found' },
        { status: 404 }
      );
    }

    if (existingPublication.publishedById !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to unpublish this' },
        { status: 403 }
      );
    }

    await prisma.$transaction([
      prisma.publication.delete({ where: { id } }),
      prisma.process.update({
        where: { id: existingPublication.processId },
        data: { status: 'DRAFT', publishedAt: null },
      }),
    ]);

    await createAuditLog({
      userId: session.user.id,
      action: 'DELETE',
      resource: 'publication',
      resourceId: id,
      details: { processId: existingPublication.processId },
    });

    return NextResponse.json({ message: 'Publication removed successfully' });
  } catch (error) {
    console.error('Error deleting publication:', error);
    return NextResponse.json(
      { error: 'Failed to delete publication' },
      { status: 500 }
    );
  }
}
