import React from 'react';

// Colorful hand-drawn doodle-style SVG icons for product tags
// Each icon has its own semantic color that matches the tag meaning

interface IconProps {
    size?: number;
    color?: string;
}

// Semantic color palette for tag icons
export const TAG_COLORS: Record<string, { icon: string; bg: string; text: string; border: string }> = {
    'Air Purifying': { icon: '#2d8a4e', bg: '#e6f7ed', text: '#1a5c33', border: '#b8e6c8' },
    'Low Maintenance': { icon: '#5b8c3e', bg: '#eef6e6', text: '#3d6128', border: '#c8e0b0' },
    'Pet Friendly': { icon: '#b45309', bg: '#fef3e2', text: '#8a3f06', border: '#f5d9a8' },
    'Perfect Gift': { icon: '#dc2667', bg: '#fde8f0', text: '#a51d4f', border: '#f5b8cf' },
    'Bestseller': { icon: '#d97706', bg: '#fef9e7', text: '#92610c', border: '#f5e0a0' },
    'Beginner Friendly': { icon: '#059669', bg: '#e6faf4', text: '#047553', border: '#a7f0d6' },
    'New Arrival': { icon: '#7c3aed', bg: '#f0ebff', text: '#5b28b0', border: '#d4c4f5' },
    'Rare Find': { icon: '#6366f1', bg: '#eef0ff', text: '#4338ca', border: '#c7d2fe' },
    'Fast Growing': { icon: '#16a34a', bg: '#e8fbe8', text: '#15803d', border: '#a3e6a3' },
    'Flowering': { icon: '#ec4899', bg: '#fdf2f8', text: '#be185d', border: '#f9a8d4' },
    'Fragrant': { icon: '#a855f7', bg: '#f5f0ff', text: '#7e22ce', border: '#dbb4fe' },
    'Drought Tolerant': { icon: '#ca8a04', bg: '#fefce8', text: '#a16207', border: '#fde68a' },
    'Sun Loving': { icon: '#ea580c', bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
    'Shade Loving': { icon: '#4f46e5', bg: '#eef2ff', text: '#3730a3', border: '#c7d2fe' },
    'Ceramic': { icon: '#9a6e3a', bg: '#fdf5ec', text: '#7c5a2e', border: '#e8d4b8' },
    'Handcrafted': { icon: '#b45309', bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
    'Premium': { icon: '#b8860b', bg: '#fefbf0', text: '#8b6914', border: '#f5e6a8' },
    'Gift Ready': { icon: '#e11d48', bg: '#fff1f2', text: '#be123c', border: '#fecdd3' },
    'Value Pack': { icon: '#0891b2', bg: '#ecfeff', text: '#0e7490', border: '#a5f3fc' },
    'Durable': { icon: '#475569', bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' },
    'Versatile': { icon: '#0d9488', bg: '#f0fdfa', text: '#0f766e', border: '#99f6e4' },
    'Easy Care': { icon: '#22c55e', bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
    'Hardy': { icon: '#365314', bg: '#f7fee7', text: '#3f6212', border: '#d9f99d' },
};

// Default fallback color for unknown tags
const DEFAULT_TAG_COLOR = { icon: '#1a4d2e', bg: '#e8f5e9', text: '#1a4d2e', border: '#c8e6c9' };

// Air Purifying — a sketchy leaf
export const AirPurifyingIcon = ({ size = 14, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || TAG_COLORS['Air Purifying'].icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c0-6 3-9 8-10-3 0-6-1-8-4-2 3-5 4-8 4 5 1 8 4 8 10z" />
        <path d="M12 22V10" />
        <path d="M9 15c1-1 2-1 3-1" />
    </svg>
);

// Low Maintenance — a small thumbs-up seedling  
export const LowMaintenanceIcon = ({ size = 14, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || TAG_COLORS['Low Maintenance'].icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 18h8c1 0 2-1 2-2v-4H6v4c0 1 1 2 2 2z" />
        <path d="M6 12l2-5h8l2 5" />
        <path d="M12 7V4" />
        <path d="M10 14l4 0" />
    </svg>
);

// Pet Friendly — a sketchy paw print
export const PetFriendlyIcon = ({ size = 14, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || TAG_COLORS['Pet Friendly'].icon} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7" cy="8" r="2" />
        <circle cx="17" cy="8" r="2" />
        <circle cx="5" cy="14" r="1.5" />
        <circle cx="19" cy="14" r="1.5" />
        <path d="M8 18c0-2 2-4 4-4s4 2 4 4c0 1.5-2 3-4 3s-4-1.5-4-3z" />
    </svg>
);

// Perfect Gift — a sketchy gift box
export const PerfectGiftIcon = ({ size = 14, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || TAG_COLORS['Perfect Gift'].icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="1" />
        <rect x="5" y="7" width="14" height="4" rx="1" />
        <path d="M12 7v14" />
        <path d="M12 7c-1.5-2-4-3-4-3s2-1 4 1c2-2 4-1 4-1s-2.5 1-4 3z" />
    </svg>
);

// Bestseller — a sketchy star
export const BestsellerIcon = ({ size = 14, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || TAG_COLORS['Bestseller'].icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.9 6.3 6.6.8-4.9 4.5 1.3 6.6L12 17l-5.9 3.2 1.3-6.6L2.5 9.1l6.6-.8z" />
    </svg>
);

// Beginner Friendly — a happy seedling sprout
export const BeginnerFriendlyIcon = ({ size = 14, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || TAG_COLORS['Beginner Friendly'].icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22v-8" />
        <path d="M12 14c-3-3-7-2-7 1 2.5 0 5 .5 7 3" />
        <path d="M12 14c3-3 7-2 7 1-2.5 0-5 .5-7 3" />
        <path d="M8 22h8" />
    </svg>
);

// New Arrival — a sparkle/twinkle
export const NewArrivalIcon = ({ size = 14, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || TAG_COLORS['New Arrival'].icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        <path d="M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
        <circle cx="12" cy="12" r="2" />
    </svg>
);

// Rare Find — a sketchy diamond/gem
export const RareFindIcon = ({ size = 14, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || TAG_COLORS['Rare Find'].icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3h12l4 7-10 12L2 10z" />
        <path d="M2 10h20" />
        <path d="M12 22l3-12M12 22l-3-12" />
        <path d="M6 3l3 7M18 3l-3 7" />
    </svg>
);

// Fast Growing — an upward arrow/sprout shooting up
export const FastGrowingIcon = ({ size = 14, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || TAG_COLORS['Fast Growing'].icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V6" />
        <path d="M7 11l5-5 5 5" />
        <path d="M8 16c2-1 3-3 4-5" />
        <path d="M16 16c-2-1-3-3-4-5" />
        <path d="M9 3l3-1 3 1" />
    </svg>
);

// Flowering — a small doodle flower
export const FloweringIcon = ({ size = 14, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || TAG_COLORS['Flowering'].icon} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="10" r="2.5" />
        <path d="M12 7.5c0-3-2-4.5-2-4.5s3 .5 2 4.5" />
        <path d="M14.2 8.8c2.2-2.2 4.5-1.5 4.5-1.5s-1.5.5-4.5 1.5" />
        <path d="M14.5 11.5c3 0 4.5 2 4.5 2s-2-.5-4.5-2" />
        <path d="M12 12.5c0 3 2 4.5 2 4.5s-3-.5-2-4.5" />
        <path d="M9.8 11.5c-3 0-4.5 2-4.5 2s2-.5 4.5-2" />
        <path d="M9.5 8.8c-2.2-2.2-4.5-1.5-4.5-1.5s1.5.5 4.5 1.5" />
        <path d="M12 22v-5" />
        <path d="M10 20c1-1 2-1 2-1" />
    </svg>
);

// Fragrant — scent waves from a petal
export const FragrantIcon = ({ size = 14, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || TAG_COLORS['Fragrant'].icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20c-2 0-4-2-4-5 0-4 4-7 4-7s4 3 4 7c0 3-2 5-4 5z" />
        <path d="M12 13v4" />
        <path d="M7 6c-1-2 0-4 0-4" />
        <path d="M12 5c0-2 1-4 1-4" />
        <path d="M17 6c1-2 0-4 0-4" />
    </svg>
);

// Drought Tolerant — a cactus
export const DroughtTolerantIcon = ({ size = 14, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || TAG_COLORS['Drought Tolerant'].icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V6" />
        <path d="M10 6c0-2 1-3 2-3s2 1 2 3" />
        <path d="M14 10h3c2 0 3 1 3 2s0 3-3 3h-3" />
        <path d="M10 13H7c-2 0-3 1-3 2s0 3 3 3h3" />
        <path d="M8 22h8" />
    </svg>
);

// Sun Loving — a sketchy sun
export const SunLovingIcon = ({ size = 14, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || TAG_COLORS['Sun Loving'].icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        <path d="M4.9 4.9l2.1 2.1M16.9 16.9l2.1 2.1M4.9 19.1l2.1-2.1M16.9 7.1l2.1-2.1" />
    </svg>
);

// Shade Loving — a crescent moon
export const ShadeLovingIcon = ({ size = 14, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || TAG_COLORS['Shade Loving'].icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 14.5c-1.8 1.5-4 2.5-6.5 2.5C8.6 17 4.5 13 4.5 8c0-1.5.3-2.9.9-4.2C2.8 5.8 1 9 1 12.5 1 18 5.5 22 11 22c3.2 0 6.1-1.5 8-3.8l1-3.7z" />
        <circle cx="16" cy="6" r="1" />
        <circle cx="20" cy="10" r="0.7" />
    </svg>
);

// Ceramic — a sketchy pot/vase
export const CeramicIcon = ({ size = 14, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || TAG_COLORS['Ceramic'].icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3h8v2H8z" />
        <path d="M7 5c-1 3-2 7-1 11h12c1-4 0-8-1-11" />
        <path d="M6 16l-1 2h14l-1-2" />
        <path d="M5 18h14v2H5z" />
        <path d="M9 9c2 0 4 1 6 0" />
    </svg>
);

// Handcrafted — hands crafting
export const HandcraftedIcon = ({ size = 14, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || TAG_COLORS['Handcrafted'].icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3l-1 8" />
        <path d="M10 3l1 8" />
        <path d="M9 11c-2 0-3 1-3 3v3c0 2 2 4 6 4s6-2 6-4v-3c0-2-1-3-3-3" />
        <path d="M9 15c1 .5 2 1 3 1s2-.5 3-1" />
        <path d="M6 3l2 8" />
        <path d="M18 3l-2 8" />
    </svg>
);

// Premium — a crown
export const PremiumIcon = ({ size = 14, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || TAG_COLORS['Premium'].icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18h18l-2-10-4 4-3-6-3 6-4-4z" />
        <path d="M3 18v2h18v-2" />
        <circle cx="5" cy="8" r="1" />
        <circle cx="12" cy="6" r="1" />
        <circle cx="19" cy="8" r="1" />
    </svg>
);

// Gift Ready — a ribbon/bow
export const GiftReadyIcon = ({ size = 14, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || TAG_COLORS['Gift Ready'].icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 12c-3-2-5-5-3-7 1-1 3-.5 3 2" />
        <path d="M12 12c3-2 5-5 3-7-1-1-3-.5-3 2" />
        <path d="M12 12v9" />
        <path d="M7 15c2-1 3-2 5-3" />
        <path d="M17 15c-2-1-3-2-5-3" />
        <path d="M6 18c3-1 4-3 6-4" />
        <path d="M18 18c-3-1-4-3-6-4" />
    </svg>
);

// Value Pack — stacked boxes
export const ValuePackIcon = ({ size = 14, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || TAG_COLORS['Value Pack'].icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="12" width="16" height="8" rx="1" />
        <rect x="6" y="6" width="12" height="6" rx="1" />
        <path d="M12 6v14" />
        <path d="M4 16h16" />
    </svg>
);

// Durable — a shield
export const DurableIcon = ({ size = 14, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || TAG_COLORS['Durable'].icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l8 3v5c0 5-3 9-8 11-5-2-8-6-8-11V6z" />
        <path d="M9 12l2 2 4-4" />
    </svg>
);

// Versatile — a compass/multi-direction
export const VersatileIcon = ({ size = 14, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || TAG_COLORS['Versatile'].icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M16 8l-6 2 2 6 6-2z" />
    </svg>
);

// Easy Care — a happy plant
export const EasyCareIcon = ({ size = 14, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || TAG_COLORS['Easy Care'].icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22v-6" />
        <circle cx="12" cy="10" r="6" />
        <path d="M9 9a1 1 0 011 0" />
        <path d="M14 9a1 1 0 011 0" />
        <path d="M9 13c1 1.5 5 1.5 6 0" />
        <path d="M12 4V2" />
        <path d="M15 5l1-1.5" />
        <path d="M9 5L8 3.5" />
    </svg>
);

// Hardy — a sturdy tree
export const HardyIcon = ({ size = 14, color }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || TAG_COLORS['Hardy'].icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22v-8" />
        <path d="M12 14l-6-4 3 0-4-4 3 0-4-4h16l-4 4h3l-4 4h3z" />
    </svg>
);

// Map tag name to icon component
export const TAG_ICONS: Record<string, React.FC<IconProps>> = {
    'Air Purifying': AirPurifyingIcon,
    'Low Maintenance': LowMaintenanceIcon,
    'Pet Friendly': PetFriendlyIcon,
    'Perfect Gift': PerfectGiftIcon,
    'Bestseller': BestsellerIcon,
    'Beginner Friendly': BeginnerFriendlyIcon,
    'New Arrival': NewArrivalIcon,
    'Rare Find': RareFindIcon,
    'Fast Growing': FastGrowingIcon,
    'Flowering': FloweringIcon,
    'Fragrant': FragrantIcon,
    'Drought Tolerant': DroughtTolerantIcon,
    'Sun Loving': SunLovingIcon,
    'Shade Loving': ShadeLovingIcon,
    'Ceramic': CeramicIcon,
    'Handcrafted': HandcraftedIcon,
    'Premium': PremiumIcon,
    'Gift Ready': GiftReadyIcon,
    'Value Pack': ValuePackIcon,
    'Durable': DurableIcon,
    'Versatile': VersatileIcon,
    'Easy Care': EasyCareIcon,
    'Hardy': HardyIcon,
};

// Helper: get tag color scheme (with fallback)
export const getTagColors = (tag: string) => TAG_COLORS[tag] || DEFAULT_TAG_COLOR;

// Helper component that renders the correct icon for a tag
export const TagIcon = ({ tag, size = 14, color }: { tag: string; size?: number; color?: string }) => {
    const IconComponent = TAG_ICONS[tag];
    if (!IconComponent) return null;
    return <IconComponent size={size} color={color} />;
};
