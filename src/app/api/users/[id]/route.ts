import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { requirePermission } from '@/lib/permissions';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Users can view their own profile or need permission for others
    if (id !== session.user.id) {
      await requirePermission(session.user.id, 'users', 'read');
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        department: true,
        jobTitle: true,
        isActive: true,
        isAdmin: true,
        createdAt: true,
        roles: { include: { role: { select: { id: true, name: true } } } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith('Permission denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (id !== session.user.id) {
      await requirePermission(session.user.id, 'users', 'update');
    }

    const body = await request.json();
    const { firstName, lastName, department, jobTitle, isActive, isAdmin, roleIds } = body;

    // Only admins can change isActive, isAdmin, and roles
    const isAdminUpdate = isActive !== undefined || isAdmin !== undefined || roleIds !== undefined;
    if (isAdminUpdate && id !== session.user.id) {
      await requirePermission(session.user.id, 'users', 'manage');
    }

    if (roleIds) {
      await prisma.userRole.deleteMany({ where: { userId: id } });
      if (roleIds.length > 0) {
        await prisma.userRole.createMany({
          data: roleIds.map((roleId: string) => ({
            userId: id,
            roleId,
            assignedBy: session.user.id,
          })),
        });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(department !== undefined && { department }),
        ...(jobTitle !== undefined && { jobTitle }),
        ...(isActive !== undefined && { isActive }),
        ...(isAdmin !== undefined && { isAdmin }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        department: true,
        jobTitle: true,
        isActive: true,
        isAdmin: true,
        createdAt: true,
        roles: { include: { role: { select: { id: true, name: true } } } },
      },
    });

    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE',
      resource: 'user',
      resourceId: id,
      details: { firstName: user.firstName, lastName: user.lastName },
    });

    return NextResponse.json(user);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith('Permission denied')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
