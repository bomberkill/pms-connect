import { Skeleton } from "@/components/ui/skeleton";

export const MemberCardSkeleton = () => {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg border">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-20 rounded-md" />
        </div>
    );
};

export const MemberCardSkeletonList = ({ count = 5 }: { count?: number }) => {
    return (
        <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
                <MemberCardSkeleton key={i} />
            ))}
        </div>
    );
};
