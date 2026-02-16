const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findFirst({ where: { role: 'ADMIN' } })
    .then(u => {
        console.log(u ? 'Admin found: ' + u.email : 'No admin found');
        p.$disconnect();
    });
