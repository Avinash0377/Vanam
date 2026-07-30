/**
 * Build a public tracking URL from a courier name + AWB / tracking number.
 * Returns null if we can't confidently produce a URL.
 */
export function getCourierTrackingUrl(
    courierName?: string | null,
    trackingNumber?: string | null,
): string | null {
    if (!courierName || !trackingNumber) return null;
    const name = courierName.trim().toLowerCase();
    const awb = encodeURIComponent(trackingNumber.trim());
    if (!awb) return null;

    if (name.includes('delhivery')) return `https://www.delhivery.com/tracking?awb=${awb}`;
    if (name.includes('dtdc')) return `https://www.dtdc.in/tracking.asp?strCnno=${awb}`;
    if (name.includes('blue') && name.includes('dart')) return `https://www.bluedart.com/tracking?trackFor=0&trackNo=${awb}`;
    if (name.includes('bluedart')) return `https://www.bluedart.com/tracking?trackFor=0&trackNo=${awb}`;
    if (name.includes('xpressbees')) return `https://www.xpressbees.com/shipment/tracking?awb=${awb}`;
    if (name.includes('ecom')) return `https://ecomexpress.in/tracking/?awb_field=${awb}`;
    if (name.includes('shadowfax')) return `https://tracker.shadowfax.in/#/tracking/${awb}`;
    if (name.includes('india post') || name.includes('speed post')) return `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?tn=${awb}`;
    if (name.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${awb}`;
    if (name.includes('dhl')) return `https://www.dhl.com/in-en/home/tracking.html?tracking-id=${awb}`;
    if (name.includes('shiprocket')) return `https://shiprocket.co/tracking/${awb}`;

    return null;
}

export const COMMON_COURIERS = [
    'Delhivery',
    'DTDC',
    'Blue Dart',
    'Xpressbees',
    'Ecom Express',
    'Shadowfax',
    'India Post',
    'FedEx',
    'DHL',
    'Shiprocket',
];
