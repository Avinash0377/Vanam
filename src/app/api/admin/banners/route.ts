import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { JWTPayload } from '@/lib/auth';

// GET all banners (admin)
async function handleGet(request: NextRequest, user: JWTPayload) {
    try {
        const banners = await prisma.banner.findMany({
            orderBy: { displayOrder: 'asc' },
        });
        return NextResponse.json({ banners });
    } catch (error) {
        console.error('Failed to fetch banners:', error);
        return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
    }
}

// POST create banner
async function handlePost(request: NextRequest, user: JWTPayload) {
    try {
        const body = await request.json();
        const { title, subtitle, highlightText, accentBadge, primaryBtnText, primaryBtnLink, secondaryBtnText, secondaryBtnLink, bgGradient, imageUrl, textColor, titleColor, subtitleColor, isActive, displayOrder } = body;

        if (!title || !primaryBtnText || !primaryBtnLink) {
            return NextResponse.json({ error: 'Title, primary button text, and link are required' }, { status: 400 });
        }

        const banner = await prisma.banner.create({
            data: {
                title,
                subtitle: subtitle || null,
                highlightText: highlightText || null,
                accentBadge: accentBadge || null,
                primaryBtnText,
                primaryBtnLink,
                secondaryBtnText: secondaryBtnText || null,
                secondaryBtnLink: secondaryBtnLink || null,
                bgGradient: bgGradient || 'linear-gradient(165deg, #0d3320 0%, #1a5035 50%, #22804a 100%)',
                imageUrl: imageUrl || null,
                textColor: textColor || '#ffffff',
                titleColor: titleColor || null,
                subtitleColor: subtitleColor || null,
                isActive: isActive !== undefined ? isActive : true,
                displayOrder: displayOrder || 0,
            },
        });

        return NextResponse.json({ banner }, { status: 201 });
    } catch (error) {
        console.error('Failed to create banner:', error);
        return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    return withAdmin(request, handleGet);
}

export async function POST(request: NextRequest) {
    return withAdmin(request, handlePost);
}
