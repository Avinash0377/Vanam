/**
 * Product layout — pass-through.
 * generateMetadata has been moved to page.tsx for co-location
 * with the data-fetching logic.
 */
export default function ProductLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
