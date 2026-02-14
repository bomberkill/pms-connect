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
        <div className={cn("flex flex-col items-center justify-center text-center p-8 bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/25", className)}>
            {imageSrc ? (
                <Image src={imageSrc} alt="" width={192} height={192} className="mb-4 object-contain opacity-80" />
            ) : Icon ? (
                <div className="bg-background p-4 rounded-full mb-4 shadow-sm ring-1 ring-border">
                    <Icon className="w-8 h-8 text-muted-foreground" />
                </div>
            ) : null}

            <h3 className="text-lg font-semibold text-foreground mb-1">
                {title}
            </h3>

            {description && (
                <p className="text-sm text-muted-foreground max-w-xs mb-6">
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
