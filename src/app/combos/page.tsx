import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import CombosClient from './CombosClient';

export const metadata: Metadata = {
    title: 'Plant Combos — Save More with Curated Bundles',
    description: 'Shop curated plant combo packs at special prices. Save up to 30% when you buy together. Gift-ready packaging available. Vanam Store.',
    openGraph: {
        title: 'Plant Combos — Vanam Store',
        description: 'Curated plant bundles at special prices. Save more when you buy together!',
    },
};

export const revalidate = 120;

function serializeCombo(c: Record<string, unknown>) {
    return {
        id: c.id as string,
        name: c.name as string,
        slug: c.slug as string,
        description: (c.description as string) || undefined,
        price: c.price as number,
        comparePrice: (c.comparePrice as number) || undefined,
        stock: c.stock as number,
        images: c.images as string[],
        featured: (c.featured as boolean) || false,
    };
}

export default async function CombosPage() {
    const rawCombos = await prisma.combo.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { displayOrder: 'asc' },
    });

    const combos = rawCombos.map(c => serializeCombo(c as unknown as Record<string, unknown>));

    return <CombosClient initialCombos={combos} />;
}
