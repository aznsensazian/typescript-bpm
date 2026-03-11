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
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { term: { contains: search } },
        { definition: { contains: search } },
      ];
    }
    if (category) where.category = category;

    const [entries, total] = await Promise.all([
      prisma.dictionaryEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { term: 'asc' },
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.dictionaryEntry.count({ where }),
    ]);

    return NextResponse.json({
      data: entries,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching dictionary:', error);
    return NextResponse.json({ error: 'Failed to fetch dictionary entries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requirePermission(session.user.id, 'dictionary', 'create');

    const body = await request.json();
    const { term, definition, category } = body;

    if (!term || !definition) {
      return NextResponse.json({ error: 'Term and definition are required' }, { status: 400 });
    }

    const entry = await prisma.dictionaryEntry.create({
      data: {
        term,
        definition,
        category: category || null,
        createdById: session.user.id,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: 'CREATE',
      resource: 'dictionary',
      resourceId: entry.id,
      details: { term },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith('Permission denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error creating dictionary entry:', error);
    return NextResponse.json({ error: 'Failed to create dictionary entry' }, { status: 500 });
  }
}
