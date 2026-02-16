const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();

async function createAdmin() {
    const password = await bcrypt.hash('admin123', 10);
    const admin = await p.user.create({
        data: {
            name: 'Vanam Admin',
            mobile: '8897249374',
            email: 'vanamstore@gmail.com',
            password: password,
            role: 'ADMIN',
        },
    });
    console.log('Admin created:', admin.email);
    await p.$disconnect();
}

createAdmin().catch(e => { console.error(e); process.exit(1); });
