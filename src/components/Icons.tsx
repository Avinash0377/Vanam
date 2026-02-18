import React from 'react';

interface IconProps {
    size?: number;
    color?: string;
    className?: string;
}

// Plant/Leaf Icons
export const LeafIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
);

export const PlantIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M7 20h10" />
        <path d="M10 20c5.5-2.5.8-6.4 3-10" />
        <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
        <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
    </svg>
);

// Delivery/Truck Icon
export const TruckIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
        <path d="M15 18H9" />
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
        <circle cx="17" cy="18" r="2" />
        <circle cx="7" cy="18" r="2" />
    </svg>
);

// Star Icon
export const StarIcon = ({ size = 24, color = 'currentColor', className, filled = false }: IconProps & { filled?: boolean }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

// Heart Icon
export const HeartIcon = ({ size = 24, color = 'currentColor', className, filled = false }: IconProps & { filled?: boolean }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
);

// Gift Icon
export const GiftIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 12 20 22 4 22 4 12" />
        <rect x="2" y="7" width="20" height="5" />
        <line x1="12" y1="22" x2="12" y2="7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
);

// Check Icon
export const CheckIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

// Home/Indoor Icon
export const HomeIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

// Sun/Outdoor Icon
export const SunIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
    </svg>
);

// Message/Chat Icon
export const MessageIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

// Refresh/Return Icon
export const RefreshIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M8 16H3v5" />
    </svg>
);

// ShoppingCart Icon
export const CartIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
);

// Location/Map Icon
export const MapPinIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

// Phone Icon
export const PhoneIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);

// Mail Icon
export const MailIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);

// Clock Icon
export const ClockIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

// Tree Icon
export const TreeIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 22v-7l-2-2" />
        <path d="M17 8v.8A6 6 0 0 1 13.8 20v0H10v0A6.5 6.5 0 0 1 7 8h0a5 5 0 0 1 10 0Z" />
        <path d="m14 14-2-2" />
    </svg>
);

// Pot/Planter Icon
export const PotIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 10h14" />
        <path d="M6 14h12" />
        <path d="M7.5 10v8a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-8" />
        <path d="M8 6a4 4 0 0 1 8 0" />
    </svg>
);

// WhatsApp Icon
export const WhatsAppIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

// Arrow Right Icon
export const ArrowRightIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
    </svg>
);

// Arrow Left Icon
export const ArrowLeftIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 12H5" />
        <path d="m12 19-7-7 7-7" />
    </svg>
);

// Upload Icon
export const UploadIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

// Shield/Guarantee Icon
export const ShieldIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);

// Package Icon
export const PackageIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m7.5 4.27 9 5.15" />
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
    </svg>
);

// Users Icon
export const UsersIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

// Award/Badge Icon
export const AwardIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="8" r="6" />
        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
);

// Ribbon/Bow Icon
export const RibbonIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 11.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Z" />
        <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z" />
        <path d="M16 17s.5 3 4 5c0 0-5.5 0-8-5" />
        <path d="M8 17s-.5 3-4 5c0 0 5.5 0 8-5" />
    </svg>
);

// Calendar Icon
export const CalendarIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

// Trash Icon
export const TrashIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
);

// Dashboard/Chart Icon
export const DashboardIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
);

// Folder Icon
export const FolderIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
);

// Edit/Pencil Icon
export const EditIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
    </svg>
);

// Eye/View Icon
export const EyeIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

// Search Icon
export const SearchIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
    </svg>
);

// Grid Icon
export const GridIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
    </svg>
);

// User Icon
export const UserIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

// Logout Icon
export const LogoutIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

// Plus Icon
export const PlusIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

// ====== NURSERY/GARDEN THEMED ICONS ======

// Flower Icon
export const FlowerIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V9m-4.5 3a4.5 4.5 0 1 0 4.5 4.5M7.5 12H9m7.5 0a4.5 4.5 0 1 1-4.5 4.5m4.5-4.5H15m-3 4.5V15" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 22v-7.5" />
    </svg>
);



// Watering Can Icon
export const WateringCanIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M17 8h.01" />
        <path d="M21 12a5 5 0 0 0-5-5H6a5 5 0 0 0-5 5v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4z" />
        <path d="M1 12h4" />
        <path d="M17 8l4-4" />
        <path d="M21 4l-1 1" />
    </svg>
);

// Seedling Icon
export const SeedlingIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 22V12" />
        <path d="M12 12c0-4.42 3.58-8 8-8 0 4.42-3.58 8-8 8z" />
        <path d="M12 12c0-4.42-3.58-8-8-8 0 4.42 3.58 8 8 8z" />
        <path d="M5 22h14" />
    </svg>
);

// Garden/Fence Icon
export const GardenIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="8" width="4" height="14" rx="1" />
        <rect x="10" y="8" width="4" height="14" rx="1" />
        <rect x="17" y="8" width="4" height="14" rx="1" />
        <path d="M5 3v5" />
        <path d="M12 3v5" />
        <path d="M19 3v5" />
        <path d="M5 3a2 2 0 1 0 0-4 2 2 0 0 0 0 4" />
    </svg>
);

// Vine/Branch Icon
export const VineIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M2 22c1.25-.987 2.27-1.975 3.9-2.2a5.56 5.56 0 0 1 3.8 1.5 4 4 0 0 0 6.8-2.8c.7-2.19-.42-4.5-2.5-5.5-3-1.5-5.5 1-8 3.5s-2.5 3.5-4 3.5" />
        <path d="M7 14c-.5-2-1-4-.5-6 1.8-5.7 8.3-5.9 10.5-.7.7 1.7.6 3.5.1 5.2" />
        <path d="M15 4c1-1 2.5-2 4.5-2" />
    </svg>
);

// Butterfly Icon
export const ButterflyIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 22v-8" />
        <path d="M5.5 12.5c-1.6-1.1-2.5-2.6-2.5-4.5C3 5.5 5 3 8 3c2 0 3.5 1 4 2.5C12.5 4 14 3 16 3c3 0 5 2.5 5 5 0 1.9-.9 3.4-2.5 4.5" />
        <path d="M12 14c-3.3 0-6 2.2-6 5 0 1.4.8 2.6 2 3.5" />
        <path d="M12 14c3.3 0 6 2.2 6 5 0 1.4-.8 2.6-2 3.5" />
        <path d="M12 5.5V3" />
        <path d="M11 3.5l1-1.5 1 1.5" />
    </svg>
);

// Bee Icon
export const BeeIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <ellipse cx="12" cy="14" rx="5" ry="6" />
        <path d="M12 8V6" />
        <path d="M9.5 5l2.5 1 2.5-1" />
        <path d="M7 14h10" />
        <path d="M7 17h10" />
        <path d="M7 11h10" />
        <path d="M3 14h2" />
        <path d="M19 14h2" />
    </svg>
);

// Raindrop/Water Icon
export const RaindropIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
);

// Shovel/Gardening Tool Icon
export const ShovelIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M2 22l8-8" />
        <path d="M10 14l8-8" />
        <path d="M15.5 6.5l2-2" />
        <path d="M18 4a2 2 0 0 1 2 2c0 .6-.4 1.5-1.5 2.5L17 10l-3-3 1.5-1.5c1-1.1 1.9-1.5 2.5-1.5z" />
    </svg>
);


// Sprout Icon
export const SproutIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M7 20h10" />
        <path d="M12 20v-8" />
        <path d="M12 12c-1.5-1.5-3-3-3-5 0-3 3-5 3-5s3 2 3 5c0 2-1.5 3.5-3 5z" />
    </svg>
);

// Sunflower Icon
export const SunflowerIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="9" r="3" />
        <path d="M12 2v2" />
        <path d="M12 14v2" />
        <path d="M4.93 4.93l1.41 1.41" />
        <path d="M17.66 11.66l1.41 1.41" />
        <path d="M2 9h2" />
        <path d="M20 9h2" />
        <path d="M6.34 11.66l-1.41 1.41" />
        <path d="M19.07 4.93l-1.41 1.41" />
        <path d="M12 16v6" />
        <path d="M9 19l3-3 3 3" />
    </svg>
);

// Rose Icon
export const RoseIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 22v-8" />
        <path d="M8 22h8" />
        <path d="M12 14c-5 0-6-4-6-6 0-1 .5-2 1-2.5.5-.5 1-1 1-2.5 0 1 1 2 2 2 0-1 .5-2 2-3 1.5 1 2 2 2 3 1 0 2-1 2-2 0 1.5.5 2 1 2.5.5.5 1 1.5 1 2.5 0 2-1 6-6 6z" />
    </svg>
);

// Lotus Icon
export const LotusIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 22v-4" />
        <path d="M12 18c-2.5 0-4-1-5-3" />
        <path d="M12 18c2.5 0 4-1 5-3" />
        <path d="M12 14c-3 2-7 1-9-2 2-1 5-1 7 1" />
        <path d="M12 14c3 2 7 1 9-2-2-1-5-1-7 1" />
        <path d="M12 10c-2 3-1 7 2 9" />
        <path d="M12 10c2 3 1 7-2 9" />
        <path d="M12 10c0-4 2-8 6-10-1 4-2 7-6 10" />
        <path d="M12 10c0-4-2-8-6-10 1 4 2 7 6 10" />
    </svg>
);

// Trending/Chart Icon
export const TrendingUpIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
    </svg>
);

// Clipboard/Report Icon
export const ClipboardIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
);

// Tag/Coupon Icon
export const TagIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
        <path d="M7 7h.01" />
    </svg>
);

// ====== NEW CHARMING NAV ICONS ======

// Seeds Icon (Sprouting seed with detailed leaf)
export const SeedsIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" opacity="0" /> {/* Spacer/Box hint */}
        <path d="M12 20a10 10 0 0 1-5-6c0-4 4-7 5-7" />
        <path d="M12 20c2-3 2-8 0-13" />
        <path d="M12 7c4-1 8 1 8 6 0 3-4 5-8 7" />
        <path d="M12 20c-3 1-5 2-5 2" /> {/* Root */}
    </svg>
);

// Pots Icon (Stacked pots)
export const PotsIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {/* Bottom Pot */}
        <path d="M6 15h12" />
        <path d="M7 19h10" />
        <path d="M18 15l-1 4a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2l-1-4" />
        {/* Top Tilted Pot */}
        <path d="M14.5 8.5l-9 4" />
        <path d="M5.5 12.5l1.5 5" /> {/* Side overlapped */}
        <path d="M16 5l-2.5-1a2 2 0 0 0-2.5 1l-1 3" />
        <path d="M16 5l1 3.5a10 10 0 0 1-2.5 4" />
    </svg>
);

// Better Stacked Pots (Simplified)
export const StackedPotsIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        {/* Bottom pot */}
        <path d="M5 14h14" />
        <path d="M6.5 14l1 6a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2l1-6" />
        {/* Top pot tilted */}
        <path d="M17 9l-10 3" />
        <path d="M7 12l.5 2" />
        <path d="M18.5 5.5l-10 3" />
        <path d="M18.5 5.5l.5 3a2 2 0 0 1-1.5 2.5l-3 1" />
        <path d="M17 9l1-3" />
    </svg>
);

// Gift Plant Icon (Gift box with leaf)
export const GiftPlantIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="4" y="12" width="16" height="10" rx="2" />
        <path d="M12 12v10" />
        <path d="M12 12V8" />
        <path d="M12 8c0-2.5-2-4-4-3-1.5.8-2 2.5 0 3" /> {/* Left leaf */}
        <path d="M12 8c0-2.5 2-4 4-3 1.5.8 2 2.5 0 3" /> {/* Right leaf */}
        <path d="M4 15h16" />
    </svg>
);

// Combos Icon (Box with plants)
export const CombosIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M12 11V7" />
        <path d="M12 7c-2 0-3-2-3-4" />
        <path d="M12 7c2 0 3-2 3-4" />
        <path d="M7.5 11l-1-3c-.5-1.5-2-1.5-2.5 0" />
        <path d="M16.5 11l1-3c.5-1.5 2-1.5 2.5 0" />
        <path d="M3 15h18" />
    </svg>
);

// Bell Icon (Notifications)
export const BellIcon = ({ size = 24, color = 'currentColor', className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);

