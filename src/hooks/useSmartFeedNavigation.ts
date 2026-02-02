'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Hook for smart feed navigation (Twitter-style)
 * - If already on feed: scroll to top
 * - If on other page: navigate to feed
 */
export const useSmartFeedNavigation = (feedPath: string = '/') => {
    const router = useRouter();
    const pathname = usePathname();

    const navigateToFeed = useCallback((e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
        }

        // Extract clean pathname (remove locale prefix)
        const cleanPathname = pathname?.replace(/^\/(fr|en)/, '') || '/';
        const cleanFeedPath = feedPath.replace(/^\/(fr|en)/, '') || '/';

        if (cleanPathname === cleanFeedPath) {
            // Already on feed, scroll to top smoothly
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // Navigate to feed
            router.push(feedPath);
        }
    }, [pathname, feedPath, router]);

    const isOnFeed = pathname?.replace(/^\/(fr|en)/, '') === feedPath.replace(/^\/(fr|en)/, '');

    return {
        navigateToFeed,
        isOnFeed,
    };
};
