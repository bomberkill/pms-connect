'use client';

import { usePathname } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Hook for smart feed navigation (Twitter-style)
 * - If already on feed: scroll to top
 * - If on other page: navigate to feed
 */
export const useSmartFeedNavigation = (feedPath: string = '/') => {
    const pathname = usePathname();

    const navigateToFeed = useCallback((e?: React.MouseEvent) => {
        // Extract clean pathname (remove locale prefix)
        const cleanPathname = pathname?.replace(/^\/(fr|en)/, '') || '/';
        const cleanFeedPath = feedPath.replace(/^\/(fr|en)/, '') || '/';

        if (cleanPathname === cleanFeedPath) {
            // Already on feed: prevent default navigation and scroll to top smoothly
            if (e) {
                e.preventDefault();
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        // Else: Do nothing! Let the native Next.js <Link> handle the navigation (prefetching, etc.)
    }, [pathname, feedPath]);

    const isOnFeed = pathname?.replace(/^\/(fr|en)/, '') === feedPath.replace(/^\/(fr|en)/, '');

    return {
        navigateToFeed,
        isOnFeed,
    };
};
