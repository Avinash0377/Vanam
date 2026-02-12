import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';

// PATCH — Update pincode (toggle active, update city/state)
async function updatePincode(
    request: NextRequest,
    user: JWTPayload,
    id: string
) {
    try {
        const body = await request.json();
        const data: Record<string, unknown> = {};

        if (typeof body.isActive === 'boolean') {
            data.isActive = body.isActive;
        }
        if (body.city !== undefined) {
            data.city = body.city?.trim() || null;
        }
        if (body.state !== undefined) {
            data.state = body.state?.trim() || null;
        }

        if (Object.keys(data).length === 0) {
            return NextResponse.json(
                { error: 'No valid fields to update' },
                { status: 400 }
            );
        }

        const updated = await prisma.serviceablePincode.update({
            where: { id },
            data,
        });

        return NextResponse.json({ message: 'Pincode updated', pincode: updated });
    } catch (error) {
        console.error('Update pincode error:', error);
        return NextResponse.json({ error: 'Failed to update pincode' }, { status: 500 });
    }
}

// DELETE — Remove pincode
async function deletePincode(
    request: NextRequest,
    user: JWTPayload,
    id: string
) {
    try {
        await prisma.serviceablePincode.delete({ where: { id } });
        return NextResponse.json({ message: 'Pincode deleted' });
    } catch (error) {
        console.error('Delete pincode error:', error);
        return NextResponse.json({ error: 'Failed to delete pincode' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    return withAdmin(request, (req, user) => updatePincode(req, user, id));
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    return withAdmin(request, (req, user) => deletePincode(req, user, id));
}
