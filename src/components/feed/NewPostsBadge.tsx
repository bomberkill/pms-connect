'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { useDictionary } from '@/hooks/use-dictionary';

interface NewPostsBadgeProps {
    count: number;
    onClick: () => void;
    show: boolean;
}

/**
 * Badge notification for new posts in feed (Twitter-style)
 * Appears at top of screen when new posts are available
 * Shows "15+" for counts > 15 to match prefetch limit
 */
export const NewPostsBadge = ({ count, onClick, show }: NewPostsBadgeProps) => {
    const dict = useDictionary();
    const DISPLAY_LIMIT = 15;

    // Display "15+" if count exceeds limit (matches prefetch behavior)
    const displayCount = count > DISPLAY_LIMIT ? `${DISPLAY_LIMIT}+` : count.toString();

    return (
        <AnimatePresence>
            {show && count > 0 && (
                <motion.button
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50
                     bg-primary text-primary-foreground px-4 py-2 rounded-full 
                     shadow-lg hover:bg-primary/90 transition-colors
                     flex items-center gap-2 text-sm font-medium cursor-pointer
                     border border-primary-foreground/20"
                    onClick={onClick}
                    aria-label={`${displayCount} ${dict.feed.newPosts}`}
                >
                    <ArrowUp className="w-3.5 h-3.5" />
                    <span>
                        {displayCount} {dict.feed.newPosts}
                    </span>
                </motion.button>
            )}
        </AnimatePresence>
    );
};
