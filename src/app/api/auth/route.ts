import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true, user: session.user });
  } catch (error) {
    console.error('Error checking auth:', error);
    return NextResponse.json({ error: 'Auth check failed' }, { status: 500 });
  }
}
