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

    const publication = await prisma.publication.findUnique({
      where: { id },
    });

    if (!publication) {
      return NextResponse.json(
        { error: 'Publication not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { rating, comment } = body;

    if (rating === undefined || rating === null) {
      return NextResponse.json(
        { error: 'Rating is required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if user already gave feedback
    const existingFeedback = await prisma.publicationFeedback.findFirst({
      where: {
        publicationId: id,
        userId: session.user.id,
      },
    });

    if (existingFeedback) {
      // Update existing feedback
      const updated = await prisma.publicationFeedback.update({
        where: { id: existingFeedback.id },
        data: {
          rating,
          comment: comment || null,
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

      return NextResponse.json(updated);
    }

    const feedback = await prisma.publicationFeedback.create({
      data: {
        publicationId: id,
        userId: session.user.id,
        rating,
        comment: comment || null,
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

    // Notify the publisher
    if (publication.publishedById !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: publication.publishedById,
          type: 'FEEDBACK',
          title: 'New feedback on your publication',
          message: `${session.user.firstName} ${session.user.lastName} rated your publication "${publication.title}"`,
          link: `/collaboration/${id}`,
        },
      });
    }

    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE',
      resource: 'publication_feedback',
      resourceId: feedback.id,
      details: { publicationId: id, rating },
    });

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error('Error creating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to create feedback' },
      { status: 500 }
    );
  }
}
