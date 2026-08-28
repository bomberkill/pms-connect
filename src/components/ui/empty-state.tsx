import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import Image from "next/image";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
    imageSrc?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className,
    imageSrc
}: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center rounded-card border border-border bg-card/80 p-7 text-center", className)}>
            {imageSrc ? (
                <Image src={imageSrc} alt="" width={192} height={192} className="mb-4 object-contain opacity-80" />
            ) : Icon ? (
                <div className="mb-3 flex size-[52px] items-center justify-center rounded-card border border-primary-100 bg-primary-50 dark:border-primary-900 dark:bg-primary-950">
                    <Icon className="size-6 text-primary" strokeWidth={1.8} />
                </div>
            ) : null}

            <h3 className="mb-1 font-heading text-[17px] font-semibold leading-tight tracking-tight text-foreground">
                {title}
            </h3>

            {description && (
                <p className="mb-5 max-w-xs text-[13.5px] leading-relaxed text-muted-foreground">
                    {description}
                </p>
            )}

            {actionLabel && onAction && (
                <Button onClick={onAction} variant="outline" className="mt-2">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
