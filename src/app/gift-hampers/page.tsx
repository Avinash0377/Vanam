import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import HampersClient from './HampersClient';

export const metadata: Metadata = {
    title: 'Gift Hampers — Premium Plant Gift Sets | Vanam Store',
    description: 'Send the gift of nature. Premium curated plant hampers with gift wrap and personalized message cards. Perfect for every occasion. Shop now at Vanam Store.',
    openGraph: {
        title: 'Gift Hampers — Vanam Store',
        description: 'Thoughtfully curated plant hampers that bring joy and serenity to your loved ones.',
    },
};

export const revalidate = 120;

function serializeHamper(h: Record<string, unknown>) {
    return {
        id: h.id as string,
        name: h.name as string,
        slug: h.slug as string,
        description: (h.description as string) || undefined,
        giftWrap: (h.giftWrap as boolean) || false,
        messageCard: (h.messageCard as boolean) || false,
        price: h.price as number,
        comparePrice: (h.comparePrice as number) || undefined,
        stock: h.stock as number,
        images: h.images as string[],
        featured: (h.featured as boolean) || false,
    };
}

export default async function HampersPage() {
    const rawHampers = await prisma.giftHamper.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { displayOrder: 'asc' },
    });

    const hampers = rawHampers.map(h => serializeHamper(h as unknown as Record<string, unknown>));

    return <HampersClient initialHampers={hampers} />;
}
