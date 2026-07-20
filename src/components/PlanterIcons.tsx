// Line-art planter icons used as an alternative to uploaded product images
// in the "Select Planter" option. Admins can pick one of these per planter
// from the product form instead of (or before) uploading photos.

import React from 'react';

interface IconProps {
    size?: number;
    className?: string;
}

const base = (size: number): React.SVGProps<SVGSVGElement> => ({
    width: size,
    height: size,
    viewBox: '0 0 48 48',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
});

const GroPot = ({ size = 40, className }: IconProps) => (
    <svg {...base(size)} className={className} aria-hidden="true">
        <rect x="9" y="13" width="30" height="5.5" rx="2" />
        <path d="M12 19l2.5 20a2.5 2.5 0 0 0 2.5 2.2h13a2.5 2.5 0 0 0 2.5-2.2L35 19" />
    </svg>
);

const Krish = ({ size = 40, className }: IconProps) => (
    <svg {...base(size)} className={className} aria-hidden="true">
        <rect x="11" y="13" width="26" height="5" rx="2.5" />
        <path d="M13 19c-1 8 1 15 5 21h12c4-6 6-13 5-21" />
    </svg>
);

const Kyoto = ({ size = 40, className }: IconProps) => (
    <svg {...base(size)} className={className} aria-hidden="true">
        <path d="M13 15h22v21a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3z" />
        <path d="M18 17v20M24 17v20M30 17v20" />
    </svg>
);

const Yoda = ({ size = 40, className }: IconProps) => (
    <svg {...base(size)} className={className} aria-hidden="true">
        <path d="M14 13h20l-2.5 13a8 8 0 0 1-15 0z" />
        <path d="M24 26v9" />
        <path d="M17 39q7-5 14 0" />
    </svg>
);

const Lagos = ({ size = 40, className }: IconProps) => (
    <svg {...base(size)} className={className} aria-hidden="true">
        <rect x="12" y="14" width="24" height="4.5" rx="1.8" />
        <path d="M14 19h20v15H14z" />
        <path d="M17 34l-2 5M31 34l2 5" />
    </svg>
);

const Roma = ({ size = 40, className }: IconProps) => (
    <svg {...base(size)} className={className} aria-hidden="true">
        <path d="M14 16c-2 8-2 16 1 23h18c3-7 3-15 1-23z" />
        <path d="M12.7 22q11.3 3.5 22.6 0" />
        <path d="M13.5 30q10.5 3 21 0" />
    </svg>
);

const Diamond = ({ size = 40, className }: IconProps) => (
    <svg {...base(size)} className={className} aria-hidden="true">
        <path d="M13 17h22l-3 22H16z" />
        <path d="M13 24l5.5 4.5L24 24l5.5 4.5L35 24" />
    </svg>
);

const TableTop = ({ size = 40, className }: IconProps) => (
    <svg {...base(size)} className={className} aria-hidden="true">
        <rect x="11" y="21" width="26" height="5" rx="2" />
        <path d="M14 26l2 12a2 2 0 0 0 2 1.7h12a2 2 0 0 0 2-1.7l2-12" />
    </svg>
);

const Spiro = ({ size = 40, className }: IconProps) => (
    <svg {...base(size)} className={className} aria-hidden="true">
        <ellipse cx="24" cy="16" rx="10.5" ry="2.8" />
        <path d="M13.5 16v20a2 2 0 0 0 2 2h17a2 2 0 0 0 2-2V16" />
    </svg>
);

const Prism = ({ size = 40, className }: IconProps) => (
    <svg {...base(size)} className={className} aria-hidden="true">
        <path d="M16 17l4-4h8l4 4v18l-4 4h-8l-4-4z" />
    </svg>
);

const Aurelius = ({ size = 40, className }: IconProps) => (
    <svg {...base(size)} className={className} aria-hidden="true">
        <path d="M18 14h12l-1.5 4c5 3 6 9 5 14-1 5-5 7-9.5 7s-8.5-2-9.5-7c-1-5 0-11 5-14z" />
    </svg>
);

const GenericPot = ({ size = 40, className }: IconProps) => (
    <svg {...base(size)} className={className} aria-hidden="true">
        <rect x="10" y="14" width="28" height="5" rx="2" />
        <path d="M13 19l2.5 19a2.5 2.5 0 0 0 2.5 2.2h12a2.5 2.5 0 0 0 2.5-2.2L35 19" />
    </svg>
);

// Registry of selectable planter icons (key must be lowercase, no spaces).
export const PLANTER_ICON_OPTIONS: { key: string; label: string; Icon: React.FC<IconProps> }[] = [
    { key: 'gropot', label: 'GroPot', Icon: GroPot },
    { key: 'krish', label: 'Krish', Icon: Krish },
    { key: 'kyoto', label: 'Kyoto', Icon: Kyoto },
    { key: 'yoda', label: 'Yoda', Icon: Yoda },
    { key: 'lagos', label: 'Lagos', Icon: Lagos },
    { key: 'roma', label: 'Roma', Icon: Roma },
    { key: 'diamond', label: 'Diamond', Icon: Diamond },
    { key: 'tabletop', label: 'Table Top', Icon: TableTop },
    { key: 'spiro', label: 'Spiro', Icon: Spiro },
    { key: 'prism', label: 'Prism', Icon: Prism },
    { key: 'aurelius', label: 'Aurelius', Icon: Aurelius },
];

const ICON_MAP: Record<string, React.FC<IconProps>> = PLANTER_ICON_OPTIONS.reduce(
    (acc, { key, Icon }) => ({ ...acc, [key]: Icon }),
    {} as Record<string, React.FC<IconProps>>
);

// Normalize a planter name to a possible icon key (e.g. "Table Top" -> "tabletop").
export function planterNameToIconKey(name?: string | null): string | undefined {
    if (!name) return undefined;
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return ICON_MAP[key] ? key : undefined;
}

// Render a planter icon by key. Falls back to a generic pot when the key is unknown.
export function PlanterIcon({ name, size = 40, className }: { name?: string | null; size?: number; className?: string }) {
    const Icon = (name && ICON_MAP[name]) || GenericPot;
    return <Icon size={size} className={className} />;
}

export default PlanterIcon;
