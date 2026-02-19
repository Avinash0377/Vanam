import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';

// PUT update banner
async function handlePut(request: NextRequest, user: JWTPayload) {
    try {
        const id = request.nextUrl.pathname.split('/').pop();
        if (!id) return NextResponse.json({ error: 'Banner ID required' }, { status: 400 });

        const body = await request.json();
        const banner = await prisma.banner.update({
            where: { id },
            data: {
                ...(body.title !== undefined && { title: body.title }),
                ...(body.subtitle !== undefined && { subtitle: body.subtitle || null }),
                ...(body.highlightText !== undefined && { highlightText: body.highlightText || null }),
                ...(body.accentBadge !== undefined && { accentBadge: body.accentBadge || null }),
                ...(body.primaryBtnText !== undefined && { primaryBtnText: body.primaryBtnText }),
                ...(body.primaryBtnLink !== undefined && { primaryBtnLink: body.primaryBtnLink }),
                ...(body.secondaryBtnText !== undefined && { secondaryBtnText: body.secondaryBtnText || null }),
                ...(body.secondaryBtnLink !== undefined && { secondaryBtnLink: body.secondaryBtnLink || null }),
                ...(body.bgGradient !== undefined && { bgGradient: body.bgGradient }),
                ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }),
                ...(body.textColor !== undefined && { textColor: body.textColor }),
                ...(body.titleColor !== undefined && { titleColor: body.titleColor || null }),
                ...(body.subtitleColor !== undefined && { subtitleColor: body.subtitleColor || null }),
                ...(body.isActive !== undefined && { isActive: body.isActive }),
                ...(body.displayOrder !== undefined && { displayOrder: body.displayOrder }),
            },
        });

        return NextResponse.json({ banner });
    } catch (error) {
        console.error('Failed to update banner:', error);
        return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 });
    }
}

// DELETE banner
async function handleDelete(request: NextRequest, user: JWTPayload) {
    try {
        const id = request.nextUrl.pathname.split('/').pop();
        if (!id) return NextResponse.json({ error: 'Banner ID required' }, { status: 400 });

        await prisma.banner.delete({ where: { id } });
        return NextResponse.json({ message: 'Banner deleted' });
    } catch (error) {
        console.error('Failed to delete banner:', error);
        return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    return withAdmin(request, handlePut);
}

export async function DELETE(request: NextRequest) {
    return withAdmin(request, handleDelete);
}
