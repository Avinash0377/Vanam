import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin } from '@/lib/middleware';
import { sendTestEmail } from '@/lib/email';

const SINGLETON_ID = 'notification-settings';

async function getSettings() {
    try {
        let settings = await prisma.notificationSettings.findUnique({
            where: { id: SINGLETON_ID },
        });

        if (!settings) {
            settings = await prisma.notificationSettings.create({
                data: {
                    id: SINGLETON_ID,
                    adminEmail: process.env.NEXT_PUBLIC_BUSINESS_EMAIL || '',
                    orderAlertsEnabled: true,
                    lowStockAlertsEnabled: true,
                    customerEmailsEnabled: true,
                    lowStockThreshold: 5,
                },
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Get notification settings error:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

async function updateSettings(request: NextRequest) {
    try {
        const body = await request.json();
        const { adminEmail, orderAlertsEnabled, lowStockAlertsEnabled, customerEmailsEnabled, lowStockThreshold } = body;

        const settings = await prisma.notificationSettings.upsert({
            where: { id: SINGLETON_ID },
            update: {
                adminEmail: adminEmail ?? undefined,
                orderAlertsEnabled: orderAlertsEnabled ?? undefined,
                lowStockAlertsEnabled: lowStockAlertsEnabled ?? undefined,
                customerEmailsEnabled: customerEmailsEnabled ?? undefined,
                lowStockThreshold: lowStockThreshold ?? undefined,
            },
            create: {
                id: SINGLETON_ID,
                adminEmail: adminEmail || '',
                orderAlertsEnabled: orderAlertsEnabled ?? true,
                lowStockAlertsEnabled: lowStockAlertsEnabled ?? true,
                customerEmailsEnabled: customerEmailsEnabled ?? true,
                lowStockThreshold: lowStockThreshold ?? 5,
            },
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Update notification settings error:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}

async function testEmail(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const success = await sendTestEmail(email);

        if (success) {
            return NextResponse.json({ message: 'Test email sent successfully!' });
        } else {
            return NextResponse.json(
                { error: 'Failed to send test email. Please check your Resend API key in .env' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Test email error:', error);
        return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    return withAdmin(request, () => getSettings());
}

export async function PUT(request: NextRequest) {
    return withAdmin(request, (req) => updateSettings(req));
}

export async function POST(request: NextRequest) {
    return withAdmin(request, (req) => testEmail(req));
}
