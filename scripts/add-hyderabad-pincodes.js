// Bulk add major Hyderabad area pincodes with area names
// Usage: node scripts/add-hyderabad-pincodes.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const hyderabadPincodes = [
    // --- IT Corridor / Hi-Tech City ---
    { pincode: '500081', city: 'Madhapur, Hyderabad', state: 'Telangana' },
    { pincode: '500084', city: 'Gachibowli, Hyderabad', state: 'Telangana' },
    { pincode: '500032', city: 'HITEC City, Hyderabad', state: 'Telangana' },
    { pincode: '500033', city: 'Kondapur, Hyderabad', state: 'Telangana' },
    { pincode: '500046', city: 'Nanakramguda, Hyderabad', state: 'Telangana' },

    // --- Kukatpally / KPHB ---
    { pincode: '500072', city: 'Kukatpally, Hyderabad', state: 'Telangana' },
    { pincode: '500085', city: 'KPHB Colony, Hyderabad', state: 'Telangana' },
    { pincode: '500090', city: 'Allwyn Colony, Hyderabad', state: 'Telangana' },

    // --- Miyapur / Chandanagar ---
    { pincode: '500049', city: 'Miyapur, Hyderabad', state: 'Telangana' },
    { pincode: '500050', city: 'Chandanagar, Hyderabad', state: 'Telangana' },
    { pincode: '502032', city: 'Manikonda, Hyderabad', state: 'Telangana' },

    // --- Banjara Hills / Jubilee Hills ---
    { pincode: '500034', city: 'Banjara Hills, Hyderabad', state: 'Telangana' },
    { pincode: '500033', city: 'Jubilee Hills, Hyderabad', state: 'Telangana' },
    { pincode: '500082', city: 'Film Nagar, Hyderabad', state: 'Telangana' },

    // --- Ameerpet / SR Nagar / Punjagutta ---
    { pincode: '500016', city: 'Ameerpet, Hyderabad', state: 'Telangana' },
    { pincode: '500038', city: 'Punjagutta, Hyderabad', state: 'Telangana' },
    { pincode: '500073', city: 'SR Nagar, Hyderabad', state: 'Telangana' },

    // --- Begumpet / Somajiguda ---
    { pincode: '500016', city: 'Begumpet, Hyderabad', state: 'Telangana' },
    { pincode: '500082', city: 'Somajiguda, Hyderabad', state: 'Telangana' },

    // --- Secunderabad ---
    { pincode: '500003', city: 'Secunderabad', state: 'Telangana' },
    { pincode: '500009', city: 'Trimulgherry, Secunderabad', state: 'Telangana' },
    { pincode: '500015', city: 'Tarnaka, Secunderabad', state: 'Telangana' },
    { pincode: '500026', city: 'Paradise, Secunderabad', state: 'Telangana' },
    { pincode: '500056', city: 'West Marredpally, Secunderabad', state: 'Telangana' },
    { pincode: '500025', city: 'Maredpally, Secunderabad', state: 'Telangana' },
    { pincode: '500062', city: 'Bolaram, Secunderabad', state: 'Telangana' },

    // --- Kompally / Medchal ---
    { pincode: '500014', city: 'Kompally, Hyderabad', state: 'Telangana' },
    { pincode: '501401', city: 'Medchal, Hyderabad', state: 'Telangana' },

    // --- Uppal / LB Nagar / Dilsukhnagar ---
    { pincode: '500039', city: 'Uppal, Hyderabad', state: 'Telangana' },
    { pincode: '500074', city: 'LB Nagar, Hyderabad', state: 'Telangana' },
    { pincode: '500060', city: 'Dilsukhnagar, Hyderabad', state: 'Telangana' },
    { pincode: '500035', city: 'Nagole, Hyderabad', state: 'Telangana' },

    // --- Abids / Nampally / Charminar ---
    { pincode: '500001', city: 'Abids, Hyderabad', state: 'Telangana' },
    { pincode: '500012', city: 'Nampally, Hyderabad', state: 'Telangana' },
    { pincode: '500002', city: 'Charminar, Hyderabad', state: 'Telangana' },
    { pincode: '500024', city: 'Sultan Bazaar, Hyderabad', state: 'Telangana' },

    // --- Mehdipatnam / Tolichowki ---
    { pincode: '500028', city: 'Mehdipatnam, Hyderabad', state: 'Telangana' },
    { pincode: '500008', city: 'Tolichowki, Hyderabad', state: 'Telangana' },
    { pincode: '500029', city: 'Shaikpet, Hyderabad', state: 'Telangana' },

    // --- Attapur / Rajendra Nagar ---
    { pincode: '500048', city: 'Attapur, Hyderabad', state: 'Telangana' },
    { pincode: '500052', city: 'Rajendra Nagar, Hyderabad', state: 'Telangana' },

    // --- Alwal / Bowenpally ---
    { pincode: '500010', city: 'Alwal, Secunderabad', state: 'Telangana' },
    { pincode: '500011', city: 'Bowenpally, Secunderabad', state: 'Telangana' },

    // --- Habsiguda / Nacharam ---
    { pincode: '500007', city: 'Habsiguda, Hyderabad', state: 'Telangana' },
    { pincode: '500076', city: 'Nacharam, Hyderabad', state: 'Telangana' },

    // --- Sainikpuri / AS Rao Nagar / ECIL ---
    { pincode: '500062', city: 'AS Rao Nagar, Secunderabad', state: 'Telangana' },
    { pincode: '500094', city: 'Sainikpuri, Secunderabad', state: 'Telangana' },
    { pincode: '500062', city: 'ECIL, Hyderabad', state: 'Telangana' },

    // --- Shamshabad (Airport Area) ---
    { pincode: '501218', city: 'Shamshabad, Hyderabad', state: 'Telangana' },

    // --- Bachupally / Nizampet ---
    { pincode: '500090', city: 'Bachupally, Hyderabad', state: 'Telangana' },
    { pincode: '500085', city: 'Nizampet, Hyderabad', state: 'Telangana' },
    { pincode: '500055', city: 'Pragathi Nagar, Hyderabad', state: 'Telangana' },

    // --- Chanda Nagar / Lingampally ---
    { pincode: '500050', city: 'Lingampally, Hyderabad', state: 'Telangana' },
];

async function main() {
    // First, delete all existing pincodes
    const deleted = await prisma.serviceablePincode.deleteMany({});
    console.log(`🗑️  Cleared ${deleted.count} old pincodes\n`);

    // Deduplicate by pincode (keep first occurrence)
    const unique = new Map();
    for (const p of hyderabadPincodes) {
        if (!unique.has(p.pincode)) {
            unique.set(p.pincode, p);
        }
    }

    console.log(`🌿 Adding ${unique.size} Hyderabad area pincodes...\n`);

    let added = 0;
    for (const [, data] of unique) {
        await prisma.serviceablePincode.create({ data: { ...data, isActive: true } });
        console.log(`  ✅ ${data.pincode} — ${data.city}`);
        added++;
    }

    console.log(`\n✅ Done! Added ${added} pincodes.`);
    console.log(`📍 Total in DB: ${await prisma.serviceablePincode.count()}\n`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
